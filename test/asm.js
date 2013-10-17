'use strict';

var should = require('should')
  , z80 = require ('../z80');

describe('asm inst', function() {
  it('nop', function() {
    should(z80.asm('nop')).be.eql([0]);
  });

  it('ret', function() {
    should(z80.asm('ret')).be.eql([0xc9]);
  });

  it('xor a', function() {
    should(z80.asm('xor a')).be.eql([0xa8+7]);
  });

  it('ld a,1', function() {
    should(z80.asm('ld a,1')).be.eql([0x3e, 1]);
  });

  it('ld a,l', function() {
    should(z80.asm('ld a,l')).be.eql([0x78+5]);
  });

  it('ld b,(hl)', function() {
    should(z80.asm('ld b,(hl)')).be.eql([0x46]);
  });
});