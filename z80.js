'use strict';

var _ = require('underscore')
  , parser = require('./parser');

module.exports = {
  offset: 0,

  org: function(n) {
    this.offset = n;
  },

  asm: function(code) {
    var ast = parser.parse(code);
    var bytes = _.filter(_.flatten(ast), function(i) {
                  return i !== '';
                });
    this.offset += bytes.length;
    return bytes;
  }
};