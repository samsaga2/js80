'use strict';

var _ = require('underscore')
  , parser = require('./parser');

module.exports = {
  asm: function(code) {
    var ast = parser.parse(code);
    return _.flatten(ast);
  }
};