'use strict';

var parser = require('./parser')
  , z80parser = require('./z80parser')
  , _ = require('underscore');

function Z80() {
  this.offset = 0;
  this.labels = {};
}

function buildArg(arg) {
    if(arg.id) {
      return arg.id;
    } else if(arg.num) {
      return arg.num;
    } else if(arg.ptr) {
      return "(" + buildArg(arg.ptr) + ")";
    } else {
      throw new Error('Internal error ' + arg);
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
  return parseInst(ast);
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
