'use strict';

var should = require('should')
  , Z80 = require ('../lib/z80');

describe('asm inst', function() {
  it('ifdef', function() {
    var z80 = new Z80();
    z80.asm('test equ 1\nifdef test\nnop\nendif');
    should(z80.image.build()).be.eql([0]);
  });

  it('ifdef else', function() {
    var z80 = new Z80();
    z80.asm('test equ 1\nifdef test\nnop\nelse\nxor a\nendif');
    should(z80.image.build()).be.eql([0]);
  });

  it('ifdef else inf', function() {
    var z80 = new Z80();
    z80.asm('ifdef test\nnop\nelse\nxor a\nendif');
    should(z80.image.build()).be.eql([0xa8+7]);
  });

  it('ifndef', function() {
    var z80 = new Z80();
    z80.asm('test2 equ 1\nifndef test\nnop\nendif');
    should(z80.image.build()).be.eql([0]);
  });

  it('ifndef else', function() {
    var z80 = new Z80();
    z80.asm('test2 equ 1\nifndef test\nnop\nelse\nxor a\nendif');
    should(z80.image.build()).be.eql([0]);
  });

  it('ifndef else inf', function() {
    var z80 = new Z80();
    z80.asm('ifndef test\nnop\nelse\nxor a\nendif');
    should(z80.image.build()).be.eql([0]);
  });
});