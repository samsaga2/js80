'use strict';

var parser = require('./parser')
  , z80parser = require('./z80parser');

function Z80() {
  this.offset = 0;
  this.labels = {};
}

function parseInst(ast) {
  var template = ast.inst;
  if(ast.src) {
    template += " " + ast.src.id;
  }
  var bytes = z80parser.parse(template);
  return bytes;
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
