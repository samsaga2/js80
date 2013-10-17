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

  it('set 2,(ix+10)', function() {
    should(z80.asm('set 2,(ix+10)')).be.eql([0xdd, 0xcb, 10, 0xc6+8*2]);
  });

  it('out (0x98),a; or 5', function() {
    should(z80.asm('out (0x98),a\nor 5')).be.eql([0xd3, 0x98, 0xf6, 5]);
  });

  it('nop // comment', function() {
    should(z80.asm('nop // comment')).be.eql([0]);
  });
});