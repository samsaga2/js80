'use strict';

var _ = require('underscore')
  , parser = require('./parser');

function Z80() {
  this.offset = 0;
  this.labels = {};
}

Z80.prototype.asm = function(code) {
  var ast = _.flatten(parser.parse(code));
  var bytes = [];
  var self = this;
  _.each(ast, function(ast) {
    if(ast.org) {
      self.offset = ast.org;
    } else if(ast.label) {
      self.defineLabel(ast.label);
    } else {
      bytes.push(ast);
      self.offset++;
    }
  });
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
