'use strict';

var should = require('should')
  , z80 = require ('../z80');

describe('assemble opcodes', function() {
  it('nop', function() {
    should(z80.asm('nop')).be.eql([0]);
  });

  it('ret', function() {
    should(z80.asm('ret')).be.eql([0xc9]);
  });

  it('xor a', function() {
    should(z80.asm('xor a')).be.eql([0xa8+7]);
  });
});