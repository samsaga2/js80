'use strict';

var parser = require('./parser')
  , z80parser = require('./z80parser')
  , util = require('util')
  , _ = require('underscore')
  , fs = require('fs');

function reduce(l, func) {
  return _.reduce(_.rest(l), function(memo, num) { return func(memo, num); }, _.first(l));
}

function compl2(v) {
  return (v<0) ? (256+v) : v;
}

function Z80() {
  this.output = [];
  this.org = 0;
  this.offset = 0;
  this.labels = {};
  this.secondPass = {};
  this.lastDefinedLabel = "";
}

Z80.prototype.inferenceLabel = function(label) {
  if(label[0] === '.') {
    return this.lastDefinedLabel + label;
  } else {
    return label;
  }
}

Z80.prototype.evalExpr = function(expr) {
  if (expr.id === '__here__') {
    return this.offset + this.org;
  } else if (expr.id && this.labels[expr.id]) {
    return this.labels[expr.id].toString();
  } else if(expr.id) {
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
      case '+':  return reduce(values, function(l, r) { return l+r; });
      case '-':  return reduce(values, function(l, r) { return l-r; });
      case '*':  return reduce(values, function(l, r) { return l*r; });
      case '/':  return reduce(values, function(l, r) { return l/r; });
      case '<<': return reduce(values, function(l, r) { return l<<r; });
      case '>>': return reduce(values, function(l, r) { return l>>r; });
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
    } else if(p.unary === '+' && ['ix','iy'].indexOf(p.args[0].id.toString().toLowerCase()) > -1) {
      var reg = p.args[0].id.toString().toLowerCase();
      var offset = this.evalExpr({unary:p.unary, args:_.rest(p.args)});
      if(offset < 0) {
        return util.format('(%s%d)', reg, offset);
      } else {
        return util.format('(%s+%d)', reg, offset);
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

Z80.prototype.parseAsmInst = function(ast) {
  var template = ast.inst;
  var sep = ' ';
  _.each(ast.args, function(arg) {
    template += sep + this.buildTemplateArg(arg);
    sep = ',';
  }, this);
  var bytes = z80parser.parse(template);
  return this.parseBytes(bytes);
}

Z80.prototype.parseBytes = function(bytes) {
  bytes = _.map(bytes, function(b, index) {
           if(_.isObject(b)) {
             this.secondPass[this.offset + index] = b;
             b.next = this.org + this.offset + bytes.length;
             return 0;
           } else {
             return b;
           }
          }, this);
  this.offset += bytes.length;
  return bytes;
}

Z80.prototype.parseInst = function(code) {
  if("inst" in code) {
    return this.parseAsmInst(code);
  } else if("org" in code) {
    this.org = this.evalExpr(code.org.expr);
    return null;
  } else if("ds" in code) {
    return [].slice.call(new Uint8Array(this.evalExpr(code.ds.expr)));
  } else if("dw" in code) {
    return _.map(code.dw, function(i) { var ix = this.evalExpr(i.expr); return [ix&255, ix>>8]; }, this);
  } else if("db" in code) {
    return _.map(code.db, function(i) {
             if(i.str) {
               return _.map(i.str, function(i) { return i.charCodeAt(0); });
             } else {
               return this.evalExpr(i.expr);
             }
           }, this);
  } else if('equ' in code) {
    this.defineLabel(code.equ.label, this.evalExpr(code.equ.value.expr));
    return null;
  }
}

Z80.prototype.parseLine = function(line) {
  if("label" in line) {
    this.defineLabel(line.label);
  }
  if("line" in line) {
    return this.parseInst(line.line);
  }
  return [];
}

Z80.prototype.asmSecondPass = function(bytes) {
  _.each(this.secondPass, function(value, key) {
    var ix = value.value;
    if(value.label) {
      ix = this.labels[this.inferenceLabel(value.label)];
      if(_.isUndefined(ix)) {
        throw new Error('Unknown label ' + value.label);
      }
    }
    switch(value.type) {
      case 'low':
        bytes[key] = ix&255;
        break;
      case 'high':
        bytes[key] = ix>>8;
        break;
      case 'relative':
        var rel = ix - value.next;
        if(rel < - 128 || rel > 127) {
          throw new Error('Offset too large');
        }
        bytes[key] = rel;
        break;
      default:
        throw new Error('Internal error');
    }
  }, this);
  return bytes;
}

Z80.prototype.asm = function(code) {
  this.secondPass = {};
  var offset = this.offset;
  var ast = parser.parse(code);
  var bytes = _.chain(ast)
              .map(this.parseLine, this)
              .filter(function(i) { return i !== null; })
              .flatten()
              .value();
  bytes = _.map(this.asmSecondPass(bytes), compl2);
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
  fs.writeFileSync(fname, buffer, 'binary');
}

Z80.prototype.defineLabel = function(name, value) {
  if(name[0] === '.') {
    name = this.lastDefinedLabel + name;
  } else {
    this.lastDefinedLabel = name;
  }
  if(this.labels[name]) {
    throw new Error('Label '+name+' already exists');
  }
  this.labels[name] = value || (this.org + this.offset);
}

Z80.prototype.getLabel = function(name) {
  if(!this.labels[name]) {
    throw new Error('Unknow label ' + name);
  }
  return this.labels[name];
}

module.exports = Z80;
