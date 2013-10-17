'use strict';

var _ = require('underscore')
  , parser = require('./parser');

module.exports = {
  offset: 0,
  labels: {},

  reset: function() {
    this.offset = 0;
    this.labels = {};
  },

  asm: function(code) {
    var ast = parser.parse(code);
    var bytes = _.filter(_.flatten(ast), function(i) {
                  return i !== '';
                });
    this.offset += bytes.length;
    return bytes;
  },

  org: function(n) {
    this.offset = n;
  },

  defineLabel: function(name) {
    if(this.labels[name]) {
      throw new Error('Label '+name+' already exists');
    }
    this.labels[name] = this.offset;
  },

  getLabel: function(name) {
    if(!this.labels[name]) {
      throw new Error('Unknow label ' + name);
    }
    return this.labels[name];
  }
};