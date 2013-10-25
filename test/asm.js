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

  it('set 2,(iy+10+1+2)', function() {
    var z80 = new Z80();
    should(z80.asm('set 2,(iy+10+1+2)')).be.eql([0xfd, 0xcb, 10+1+2, 0xc6+8*2]);
  });

  it('set 2,(iy-10-1-2)', function() {
    var z80 = new Z80();
    should(z80.asm('set 2,(iy-10-1-2)')).be.eql([0xfd, 0xcb, 256+(-10-1-2), 0xc6+8*2]);
  });

  it('out (0x98),a \\ or 5', function() {
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

  it('ld a,1+2+3', function() {
    var z80 = new Z80();
    should(z80.asm('ld a,1+2+3')).be.eql([0x3e, 1+2+3]);
  });

  it('ld a,3-2-1', function() {
    var z80 = new Z80();
    should(z80.asm('ld a,3-2-1')).be.eql([0x3e, 3-2-1]);
  });

  it('ld a,10+1-4+5', function() {
    var z80 = new Z80();
    should(z80.asm('ld a,10+1-4+5')).be.eql([0x3e, 10+1-4+5]);
  });

  it('ld a,2*3+4*5', function() {
    var z80 = new Z80();
    should(z80.asm('ld a,2*3+4*5')).be.eql([0x3e, 2*3+4*5]);
  });

  it('ld a,(1+2)-3', function() {
    var z80 = new Z80();
    should(z80.asm('ld a,(1+2)-3')).be.eql([0x3e, (1+2)-3]);
  });

  it('ld a,(1+2)-(3+4)', function() {
    var z80 = new Z80();
    should(z80.asm('ld a,(1+2)-(3+4)')).be.eql([0x3e, 256+((1+2)-(3+4))]);
  });

  it('org 8000h \\ nop', function() {
    var z80 = new Z80();
    should(z80.asm('org 8000h\nnop')).be.eql([0]);
    should(z80.org + z80.offset).be.eql(0x8001);
  });

  it('db 1,2,3', function() {
    var z80 = new Z80();
    should(z80.asm('db 1,2,3')).be.eql([1,2,3]);
  });

  it('dw 1,2,3', function() {
    var z80 = new Z80();
    should(z80.asm('dw 1,2,3')).be.eql([1,0,2,0,3,0]);
  });

  it('ds 5', function() {
    var z80 = new Z80();
    should(z80.asm('ds 5')).be.eql([0,0,0,0,0]);
  });

  it('db "hello", 0', function() {
    var z80 = new Z80();
    should(z80.asm('db "hello", 0')).be.eql([104,101,108,108,111,0]);
  });

  it('label', function() {
    var z80 = new Z80();
    should(z80.asm('org 8000h\ntest_label: nop')).be.eql([0]);
    should(z80.getLabel('test_label')).be.eql(0x8000);
  });

  it('multiple inst per line', function() {
    var z80 = new Z80();
    should(z80.asm('nop\\test: xor a\\ret')).be.eql([0, 0xa8+7, 0xc9]);
  });

  it('call label', function() {
    var z80 = new Z80();
    should(z80.asm('org 8000h\\test_label: nop\\call test_label')).be.eql([0, 0xcd, 0, 0x80]);
  });

  it('jp label', function() {
    var z80 = new Z80();
    should(z80.asm('org 8000h\\test_label: nop\\jp test_label')).be.eql([0, 0xc3, 0, 0x80]);
  });

  it('label second pass', function() {
    var z80 = new Z80();
    should(z80.asm('org 8000h\\main: call test_label\\test_label: nop\\jp main')).be.eql([0xcd, 3, 0x80, 0, 0xc3, 0, 0x80]);
  });

  it('local label', function() {
    var z80 = new Z80();
    should(z80.asm('org 8000h\\main:\\call main.test_label\\.test_label: nop\\jp main')).be.eql([0xcd, 3, 0x80, 0, 0xc3, 0, 0x80]);
  });

  it('local label 2', function() {
    var z80 = new Z80();
    should(z80.asm('org 8000h\\main:\\call main.test_label\\.test_label: nop\\jp .test_label')).be.eql([0xcd, 3, 0x80, 0, 0xc3, 3, 0x80]);
  });

  it('local label 3', function() {
    var z80 = new Z80();
    should(z80.asm('org 8000h\\main:\\call main.1\\.1: nop\\jp .1')).be.eql([0xcd, 3, 0x80, 0, 0xc3, 3, 0x80]);
  });

  it('empty code', function() {
    var z80 = new Z80();
    should(z80.asm('org 8000h\n')).be.eql([]);
  });

  it('djnz label', function() {
    var z80 = new Z80();
    should(z80.asm('org 8000h\\test: nop\\djnz test')).be.eql([0, 0x10, 0xfd]);
  });

  it('jr label', function() {
    var z80 = new Z80();
    should(z80.asm('org 8000h\\jr test\\nop\\test: nop')).be.eql([0x18, 1, 0, 0]);
  });

  it('pepe equ 123\\ld a,pepe', function() {
    var z80 = new Z80();
    should(z80.asm('pepe equ 123\\ld a,pepe')).be.eql([0x3e, 123]);
  });

  it('ld a,1<<1', function() {
    var z80 = new Z80();
    should(z80.asm('ld a,1<<1')).be.eql([0x3e, 1<<1]);
  });

  it('ld a,1<<1+2', function() {
    var z80 = new Z80();
    should(z80.asm('ld a,1<<1+2')).be.eql([0x3e, (1<<1)+2]);
  });

  it('org 8000h \\ ld hl,$', function() {
    var z80 = new Z80();
    should(z80.asm('org 8000h\\ld hl,$')).be.eql([0x21, 0, 0x80]);
  });

  it('org 8000h \\ ld hl,$+2', function() {
    var z80 = new Z80();
    should(z80.asm('org 8000h\\ld hl,$+2')).be.eql([0x21, 2, 0x80]);
  });

  it('modules', function() {
    var z80 = new Z80();
    should(z80.asm('org 8000h\\module m1\\l1: nop\\module m2\\l2: nop\\module m3\\ld hl,m1.l1+m2.l2')).be.eql([0,0,0x21,1,(0x80+0x80)&255]);
  });

  it('include', function() {
    var z80 = new Z80();
    should(z80.asm('include "util/test.asm"').length).not.be.eql(0);
  });

  it('ds fill', function() {
    var z80 = new Z80();
    var bytes = z80.asm('org 8000h\\nop\\ds 0x8000+0x2000-$,0xff');
    should(bytes.length).be.eql(0x2000);
    should(bytes[1]).be.equal(255);
  });

  it('incbin', function() {
    var z80 = new Z80();
    should(z80.asm('incbin "util/test.asm"').length).not.be.eql(0);
  });

  it('endmodule', function() {
    var z80 = new Z80();
    should(z80.asm('module test\\l1: nop\\endmodule\\l2: nop\\module test2\\call test.l1\\call l2').length).not.be.eql([0,0,0xcd,0,0,0xcd,1,0]);
  });

  it('macro noargs', function() {
    var z80 = new Z80();
    should(z80.asm('macro test\\nop\\nop\\endmacro\\test\\test').length).not.be.eql([0,0,0,0]);
  });

  it('macro with fixed args', function() {
    var z80 = new Z80();
    should(z80.asm('macro test arg1,arg2\\ld a,arg1+arg2\\endmacro\\test 1,2').length).not.be.eql([0x3e, 1+2]);
  });

  it('macro with default args', function() {
    var z80 = new Z80();
    should(z80.asm('macro test arg1,arg2:10\\ld a,arg1+arg2\\endmacro\\test 1').length).not.be.eql([0x3e, 1+10]);
  });

  it('ld string', function() {
    var z80 = new Z80();
    (function () {
      z80.asm('ld a,"jarl"');
    }).should.throw('Invalid argument');
  });

  it('ld char', function() {
    var z80 = new Z80();
    should(z80.asm("ld a,'a'").length).not.be.eql([0x3e, 65]);
  });
});