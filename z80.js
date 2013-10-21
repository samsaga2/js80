'use strict';

var parser = require('./parser')
  , z80parser = require('./z80parser')
  , util = require('util')
  , _ = require('underscore')
  , fs = require('fs');

function reduce(l, func) {
  return _.reduce(_.rest(l), function(memo, num) { return func(memo, num); }, _.first(l));
}

function Z80() {
  this.output = [];
  this.org = 0;
  this.offset = 0;
  this.labels = {};
  this.secondPass = {};
  this.lastDefinedLabel = "";
}

Z80.prototype.evalExpr = function(expr) {
  if(expr.id) {
    return expr.id;
  } else if("num" in expr) {
    return expr.num;
  } else if(expr.neg) {
    return -this.evalExpr(expr.neg);
  } else if(expr.paren) {
    return this.evalExpr(expr.paren);
  } else if(expr.unary) {
    var values = _.map(expr.args, this.evalExpr, this);
    switch(expr.unary) {
      case '+': return reduce(values, function(l, r) { return l+r; });
      case '-': return reduce(values, function(l, r) { return l-r; });
      case '*': return reduce(values, function(l, r) { return l*r; });
      case '/': return reduce(values, function(l, r) { return l/r; });
    }
  }

  throw new Error(util.format('Internal error %j', expr));
}

Z80.prototype.buildTemplateArg = function(arg) {
  if(arg.expr.paren) {
    var p = arg.expr.paren;
    if("id" in p) {
      return "(" + p.id + ")";
    } else if("num" in p) {
      return "(" + p.num + ")";
    } else if("unary" in p && p.unary === '+' && p.args[0].id.toString().toLowerCase() === 'ix') {
      var n = this.evalExpr({unary:p.unary, args:_.rest(p.args)});
      if(n < 0) {
        return '(ix' + n + ')';
      } else {
        return '(ix+' + n + ')';
      }
    } else if("unary" in p && p.unary === '+' && p.args[0].id.toString().toLowerCase() === 'iy') {
      var n = this.evalExpr({unary:p.unary, args:_.rest(p.args)});
      if(n < 0) {
        return '(iy' + n + ')';
      } else {
        return '(iy+' + n + ')';
      }
    } else {
      return this.buildTemplateArg(arg.paren);
    }
  } else if(arg.expr) {
    return this.evalExpr(arg.expr).toString();
  } else {
    throw new Error(util.format('Internal error %j', arg));
  }
}

Z80.prototype.parseInst = function(ast) {
  var template = ast.inst;
  var sep = ' ';
  _.each(ast.args, function(arg) {
    template += sep + this.buildTemplateArg(arg);
    sep = ',';
  }, this);
  return z80parser.parse(template);
}

Z80.prototype.parseCode = function(code) {
  var bytes = [];
  if("inst" in code) {
    bytes = this.parseInst(code);
  } else if("org" in code) {
    this.org = this.evalExpr(code.org.expr);
  } else if("ds" in code) {
    bytes = [].slice.call(new Uint8Array(this.evalExpr(code.ds.expr)));
  } else if("dw" in code) {
    bytes = _.map(code.dw, function(i) { var n = this.evalExpr(i.expr); return [n&255, n>>8]; }, this);
  } else if("db" in code) {
    bytes = _.map(code.db, function(i) {
              if(i.str) {
                return _.map(i.str, function(i) { return i.charCodeAt(0); });
              } else {
                return this.evalExpr(i.expr);
              }
            }, this);
  }
  if(bytes) {
    bytes = _.flatten(bytes);
    bytes = _.map(bytes, function(b, index) {
              if(_.isObject(b)) {
                this.secondPass[this.offset] = b;
                if(b.relative) {
                  this.secondPass[this.offset].next = bytes.length - index + this.org;
                }
                this.offset++;
                return 0;
              } else {
                this.offset++;
                return b;
              }
            }, this);
  }
  return bytes;
}

Z80.prototype.parseLine = function(line) {
  if("label" in line) {
    this.defineLabel(line.label);
  }
  if("line" in line) {
    return this.parseCode(line.line);
  }
  return [];
}

Z80.prototype.asmSecondPass = function(bytes) {
  bytes = _.clone(bytes);
  _.each(this.secondPass, function(value, key) {
    if(value.low) {
      bytes[key] = this.labels[value.low]&255;
    } else if(value.high) {
      bytes[key] = this.labels[value.high]>>8;
    } else if(value.relative) {
      var rel = this.labels[value.relative] - value.next;
      if(rel < -127 || rel > 128) {
        throw new Error('Label too far');
      }
      if(rel < 0) {
        bytes[key] = 0xff + rel - 3;
      } else {
        bytes[key] = rel - 1;
      }
    } else {
      throw new Error('Internal error');
    }
  }, this);
  this.secondPass = {};
  return bytes;
}

Z80.prototype.asm = function(code) {
  var offset = this.offset;
  var ast = parser.parse(code);
  var bytes = _.flatten(_.map(ast, this.parseLine, this));
  bytes = this.asmSecondPass(bytes);
  for(var i = 0; i < bytes.length; i++) {
    this.output[offset + i] = bytes[i];
  }
  return bytes;
}

Z80.prototype.saveImage = function(fname) {
  var buffer = new Buffer(this.output.length);
  for(var i = 0; i < this.output.length; i++) {
    buffer[i] = this.output[i];
  }
  fs.writeFile(fname, buffer, 'binary', function(err) {
    if(err) {
      throw err;
    }
    console.log('Saved %s', fname);
  });
}

Z80.prototype.defineLabel = function(name) {
  if(name[0] === '.') {
    name = this.lastDefinedLabel + name;
  } else {
    this.lastDefinedLabel = name;
  }
  if(this.labels[name]) {
    throw new Error('Label '+name+' already exists');
  }
  this.labels[name] = this.org + this.offset;
}

Z80.prototype.getLabel = function(name) {
  if(!this.labels[name]) {
    throw new Error('Unknow label ' + name);
  }
  return this.labels[name];
}

module.exports = Z80;
