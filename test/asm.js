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

  it('ld a,l', function() {
    var z80 = new Z80();
    should(z80.asm('ld a,l')).be.eql([0x78+5]);
  });

  it('ld b,(hl)', function() {
    var z80 = new Z80();
    should(z80.asm('ld b,(hl)')).be.eql([0x46]);
  });

  it('set 2,(ix+10)', function() {
    var z80 = new Z80();
    should(z80.asm('set 2,(ix+10)')).be.eql([0xdd, 0xcb, 10, 0xc6+8*2]);
  });

  it('set 2,(iy+11)', function() {
    var z80 = new Z80();
    should(z80.asm('set 2,(iy+11)')).be.eql([0xdd, 0xcb, 11, 0xc6+8*2]);
  });

  it('out (0x98),a -- or 5', function() {
    var z80 = new Z80();
    should(z80.asm('out (0x98),a\nor 5')).be.eql([0xd3, 0x98, 0xf6, 5]);
  });

  it('nop // comment', function() {
    var z80 = new Z80();
    should(z80.asm('nop // comment')).be.eql([0]);
  });

  it('nop /* ... */', function() {
    var z80 = new Z80();
    should(z80.asm('nop /* comment\ncomment 2\ncomment3\n*/\nnop')).be.eql([0, 0]);
  });

  // it('ld a,1+2+3', function() {
  //   var z80 = new Z80();
  //   should(z80.asm('ld a,1+2+3')).be.eql([0x3e, 1+2+3]);
  // });

  // it('ld a,3-2-1', function() {
  //   var z80 = new Z80();
  //   should(z80.asm('ld a,3-2-1')).be.eql([0x3e, 3-2-1]);
  // });

  // it('ld a,2*3+4*5', function() {
  //   var z80 = new Z80();
  //   should(z80.asm('ld a,2*3+4*5')).be.eql([0x3e, 2*3+4*5]);
  // });

  // it('org 8000h -- nop', function() {
  //   var z80 = new Z80();
  //   should(z80.asm('org 8000h\nnop')).be.eql([0]);
  //   should(z80.offset).be.eql(0x8001);
  // });

  // it('db 1,2,3', function() {
  //   var z80 = new Z80();
  //   should(z80.asm('db 1,2,3')).be.eql([1,2,3]);
  // });

  // it('dw 1,2,3', function() {
  //   var z80 = new Z80();
  //   should(z80.asm('dw 1,2,3')).be.eql([1,0,2,0,3,0]);
  // });

  // it('ds 5', function() {
  //   var z80 = new Z80();
  //   should(z80.asm('ds 5')).be.eql([0,0,0,0,0]);
  // });

  // it('db "hello", 0', function() {
  //   var z80 = new Z80();
  //   should(z80.asm('db "hello", 0')).be.eql([104,101,108,108,111,0]);
  // });

  // it('label', function() {
  //   var z80 = new Z80();
  //   should(z80.asm('org 8000h\ntest_label: nop')).be.eql([0]);
  //   should(z80.getLabel('test_label')).be.eql(0x8000);
  // });

  // it('label without dots', function() {
  //   var z80 = new Z80();
  //   should(z80.asm('org 8000h\ntest_label nop')).be.eql([0]);
  //   should(z80.getLabel('test_label')).be.eql(0x8000);
  // });

  // it('multiple inst per line', function() {
  //   var z80 = new Z80();
  //   should(z80.asm('nop $ xor a')).be.eql([0, 0xa8+7]);
  // });
});