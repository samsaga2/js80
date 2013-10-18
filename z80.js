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

function evalExpr(expr) {
  if(expr.id) {
    return expr.id;
  } else if("num" in expr) {
    return expr.num;
  } else if(expr.neg) {
    return -evalExpr(expr.neg);
  } else if(expr.unary) {
    var values = _.map(expr.args, evalExpr);
    switch(expr.unary) {
      case '+': return reduce(values, function(l, r) { return l+r; });
      case '-': return reduce(values, function(l, r) { return l-r; });
      case '*': return reduce(values, function(l, r) { return l*r; });
      case '/': return reduce(values, function(l, r) { return l/r; });
    }
  }

  throw new Error(util.format('Internal error %j', expr));
}

function buildArg(arg) {
    if(arg.ptr) {
      return "(" + buildArg(arg.ptr) + ")";
    } else if(arg.offset_ptr) {
      if(arg.offset_ptr.offset >= 0) {
        return "(" + arg.offset_ptr.id + "+" + arg.offset_ptr.offset + ")";
      } else {
        return "(" + arg.offset_ptr.id + "-" + -arg.offset_ptr.offset + ")";
      }
    } else if(arg.expr) {
      return evalExpr(arg.expr).toString();
    } else {
      throw new Error(util.format('Internal error %j', arg));
    }
}

Z80.prototype.parseInst = function(ast) {
  // special func
  if(ast.inst === 'db' && ast.args.length > 0) {
    return _.flatten(_.map(ast.args, function(i) {
                       if(i.str) {
                         return _.map(i.str, function(i) { return i.charCodeAt(0); });
                       } else {
                         return evalExpr(i.expr);
                       }
                     }));
  }

  // z80 inst
  var template = ast.inst;
  var sep = ' ';
  _.each(ast.args, function(arg) {
    template += sep + buildArg(arg);
    sep = ',';
  });
  return z80parser.parse(template);
}

Z80.prototype.asm = function(code) {
  var ast = parser.parse(code);
  var bytes = [];
  _.each(ast, function(i) {
    if("inst" in i) {
      var b = this.parseInst(i);
      bytes = bytes.concat(b);
      this.offset += b.length;
    } else if("org" in i) {
      this.offset = evalExpr(i.org.expr);
    } else if("ds" in i) {
      var b = [].slice.call(new Uint8Array(evalExpr(i.ds.expr)));
      bytes = bytes.concat(b);
      this.offset += b.length;
    } else if("dw" in i) {
      var b = _.flatten(_.map(i.dw, function(i) { var n = evalExpr(i.expr); return [n&255, n>>8]; }));
      bytes = bytes.concat(b);
      this.offset += b.length;
    }
  }, this);
  return bytes;
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
