'use strict';

var opcodes = require('./opcodes')
  , _ = require('underscore');

function buildRegex(inst) {
  inst = inst.replace('r', '(A|B|C|D|E|H|L|\\(HL\\))');
  return inst;
}

console.log('XOR (HL)'.match(buildRegex('XOR r')));

function findOpcode(code) {
  return _.first(_.where(opcodes, {inst:code.trim().toUpperCase()}));
}

function parseOpcodes(opcodes) {
  return _.map(opcodes.split(' '), function(i) { return Number('0x'+i); });
}

module.exports = {
  asm: function(code) {
    var op = findOpcode(code);
    if(_.isEmpty(op)) {
      throw new Error('Unknown opcode: '+code);
    }
    var bytes = parseOpcodes(op.opcodes);
    return bytes;
  }
};