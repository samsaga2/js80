'use strict';

var parser = require('./parser')
  , z80parser = require('./z80parser')
  , util = require('util')
  , _ = require('underscore');

function Z80() {
  this.offset = 0;
  this.labels = {};
}

function evalExpr(expr) {
  if(expr.id) {
    return expr.id;
  } else if(expr.num) {
    return expr.num;
  } else if(expr.neg) {
    return -evalExpr(expr.neg);
  } else if(expr.unary) {
    var values = _.map(expr.args, evalExpr);
    switch(expr.unary) {
      case '+': return _.reduce(values, function(memo, num) { return memo + num; }, 0);
      case '-': return _.reduce(_.rest(values), function(memo, num) { return memo - num; }, _.first(values));
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

function parseInst(ast) {
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
  return _.flatten(_.map(ast, parseInst));
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
