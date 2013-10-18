'use strict';

var should = require('should')
  , Z80 = require ('../z80');

describe('asm inst', function() {
  it('nop', function() {
    var z80 = new Z80();
    should(z80.asm('nop')).be.eql([0]);
  });

  it('ret', function() {
    var z80 = new Z80();
    should(z80.asm('ret')).be.eql([0xc9]);
  });

  it('xor a', function() {
    var z80 = new Z80();
    should(z80.asm('xor a')).be.eql([0xa8+7]);
  });

  it('ld a,1', function() {
    var z80 = new Z80();
    should(z80.asm('ld a,1')).be.eql([0x3e, 1]);
  });
});