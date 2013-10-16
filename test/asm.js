'use strict';

var should = require('should')
  , asm = require ('../asm');

describe('assemble opcodes', function() {
  it('nop', function() {
        should(asm.code('nop')).be.eql([0]);
  });

  it('ret', function() {
    should(asm.code('ret')).be.eql([0xc9]);
  });
});