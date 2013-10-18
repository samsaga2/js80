'use strict';

var parser = require('./parser')
  , z80parser = require('./z80parser')
  , util = require('util')
  , _ = require('underscore');

function reduce(l, func) {
  return _.reduce(_.rest(l), function(memo, num) { return func(memo, num); }, _.first(l));
}

function Z80() {
  this.offset = 0;
  this.labels = {};
}

Z80.prototype.evalExpr = function(expr) {
  if(expr.id) {
    if(expr.id in this.labels) {
      return this.labels[expr.id];
    } else {
      return expr.id;
    }
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
    this.offset = this.evalExpr(code.org.expr);
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
    this.offset += bytes.length;
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

Z80.prototype.asm = function(code) {
  var ast = parser.parse(code);
  return _.flatten(_.map(ast, this.parseLine, this));
}

Z80.prototype.defineLabel = function(name) {
  if(this.labels[name]) {
    throw new Error('Label '+name+' already exists');
  }
  this.labels[name] = this.offset;
}

Z80.prototype.getLabel = function(name) {
  if(!this.labels[name]) {
    throw new Error('Unknow label ' + name);
  }
  return this.labels[name];
}

module.exports = Z80;
