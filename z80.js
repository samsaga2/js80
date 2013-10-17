'use strict';

var opcodes = require('./opcodes')
  , _ = require('underscore')
  , parser = require('./parser');

function findInstruction(inst) {
  return _.chain(opcodes)
         .where({inst:inst.opcode})
         .first()
         .value();
}

function parseBytes(opcodes) {
  return _.map(opcodes.split(' '), function(i) { return Number('0x'+i); });
}

module.exports = {
  asm: function(code) {
    var output = [];
    var ast = parser.parse(code);
    _.each(ast, function(astInst) {
      var inst = findInstruction(astInst);
      output = output.concat(parseBytes(inst.opcodes));
    });
    return output;
  }
};