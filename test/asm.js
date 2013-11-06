'use strict';

var should = require('should')
  , JS80 = require ('../lib/js80')
  , _ = require('underscore');

describe('asm inst', function() {
  it('nop', function() {
    var js80 = new JS80();
    js80.asm('nop');
    should(js80.image.build()).be.eql([0]);
  });

  it('ret', function() {
    var js80 = new JS80();
    js80.asm('ret');
    should(js80.image.build()).be.eql([0xc9]);
  });

  it('xor a', function() {
    var js80 = new JS80();
    js80.asm('xor a');
    should(js80.image.build()).be.eql([0xa8+7]);
  });

  it('ld a,1', function() {
    var js80 = new JS80();
    js80.asm('ld a,1');
    should(js80.image.build()).be.eql([0x3e, 1]);
  });

  it('ld a,l', function() {
    var js80 = new JS80();
    js80.asm('ld a,l');
    should(js80.image.build()).be.eql([0x78+5]);
  });

  it('ld b,(hl)', function() {
    var js80 = new JS80();
    js80.asm('ld b,(hl)');
    should(js80.image.build()).be.eql([0x46]);
  });

  it('set 2,(ix+10)', function() {
    var js80 = new JS80();
    js80.asm('set 2,(ix+10)');
    should(js80.image.build()).be.eql([0xdd, 0xcb, 10, 0xc6+8*2]);
  });

  it('set 2,(iy+10+1+2)', function() {
    var js80 = new JS80();
    js80.asm('set 2,(iy+10+1+2)');
    should(js80.image.build()).be.eql([0xfd, 0xcb, 10+1+2, 0xc6+8*2]);
  });

  it('set 2,(iy-10-1-2)', function() {
    var js80 = new JS80();
    js80.asm('set 2,(iy-10-1-2)');
    should(js80.image.build()).be.eql([0xfd, 0xcb, 256+(-10-1-2), 0xc6+8*2]);
  });

  it('out (0x98),a \n or 5', function() {
    var js80 = new JS80();
    js80.asm('out (0x98),a\nor 5');
    should(js80.image.build()).be.eql([0xd3, 0x98, 0xf6, 5]);
  });

  it(';; comment', function() {
    var js80 = new JS80();
    js80.asm(';; comment');
    should(js80.image.build().length).be.eql(0);
  });

  it('nop // comment', function() {
    var js80 = new JS80();
    js80.asm('nop // comment');
    should(js80.image.build()).be.eql([0]);
  });

  it('nop ; comment', function() {
    var js80 = new JS80();
    js80.asm('nop ; comment');
    should(js80.image.build()).be.eql([0]);
  });

  it('nop /* ... */', function() {
    var js80 = new JS80();
    js80.asm('nop /* comment\ncomment 2\ncomment3\n*/\nnop');
    should(js80.image.build()).be.eql([0, 0]);
  });

  it('ld a,1+2+3', function() {
    var js80 = new JS80();
    js80.asm('ld a,1+2+3');
    should(js80.image.build()).be.eql([0x3e, 1+2+3]);
  });

  it('ld a,3-2-1', function() {
    var js80 = new JS80();
    js80.asm('ld a,3-2-1');
    should(js80.image.build()).be.eql([0x3e, 3-2-1]);
  });

  it('ld a,10+1-4+5', function() {
    var js80 = new JS80();
    js80.asm('ld a,10+1-4+5');
    should(js80.image.build()).be.eql([0x3e, 10+1-4+5]);
  });

  it('ld a,2*3+4*5', function() {
    var js80 = new JS80();
    js80.asm('ld a,2*3+4*5');
    should(js80.image.build()).be.eql([0x3e, 2*3+4*5]);
  });

  it('ld a,(1+2)-3', function() {
    var js80 = new JS80();
    js80.asm('ld a,(1+2)-3');
    should(js80.image.build()).be.eql([0x3e, (1+2)-3]);
  });

  it('ld a,(1+2)-(3+4)', function() {
    var js80 = new JS80();
    js80.asm('ld a,(1+2)-(3+4)');
    should(js80.image.build()).be.eql([0x3e, 256+((1+2)-(3+4))]);
  });

  it('org 8000h \n nop', function() {
    var js80 = new JS80();
    js80.asm('org 8000h\nnop');
    should(js80.image.build()).be.eql([0]);
    should(js80.image.page.origin + js80.image.page.offset).be.eql(0x8001);
  });

  it('db 1,2,3', function() {
    var js80 = new JS80();
    js80.asm('db 1,2,3');
    should(js80.image.build()).be.eql([1,2,3]);
  });

  it('dw 1,2,3', function() {
    var js80 = new JS80();
    js80.asm('dw 1,2,3');
    should(js80.image.build()).be.eql([1,0,2,0,3,0]);
  });

  it('ds 5', function() {
    var js80 = new JS80();
    js80.asm('ds 5');
    should(js80.image.build()).be.eql([0,0,0,0,0]);
  });

  it('db "hello", 0', function() {
    var js80 = new JS80();
    js80.asm('db "hello", 0');
    should(js80.image.build()).be.eql([104,101,108,108,111,0]);
  });

  it('label', function() {
    var js80 = new JS80();
    js80.asm('org 8000h\ntest_label: nop');
    should(js80.image.build()).be.eql([0]);
    should(js80.environment.test_label).be.eql(0x8000);
  });

  it('multiple inst per line', function() {
    var js80 = new JS80();
    js80.asm('nop\\test: xor a\\ret');
    should(js80.image.build()).be.eql([0, 0xa8+7, 0xc9]);
  });

  it('call label', function() {
    var js80 = new JS80();
    js80.asm('org 8000h\ntest_label: nop\ncall test_label');
    should(js80.image.build()).be.eql([0, 0xcd, 0, 0x80]);
  });

  it('jp label', function() {
    var js80 = new JS80();
    js80.asm('org 8000h\ntest_label: nop\njp test_label');
    should(js80.image.build()).be.eql([0, 0xc3, 0, 0x80]);
  });

  it('label second pass', function() {
    var js80 = new JS80();
    js80.asm('org 8000h\nmain: call test_label\ntest_label: nop\njp main');
    should(js80.image.build()).be.eql([0xcd, 3, 0x80, 0, 0xc3, 0, 0x80]);
  });

  it('local label', function() {
    var js80 = new JS80();
    js80.asm('org 8000h\nmain:\ncall main.test_label\n.test_label: nop\njp main');
    should(js80.image.build()).be.eql([0xcd, 3, 0x80, 0, 0xc3, 0, 0x80]);
  });

  it('local label 2', function() {
    var js80 = new JS80();
    js80.asm('org 8000h\nmain:\ncall main.test_label\n.test_label: nop\njp .test_label');
    should(js80.image.build()).be.eql([0xcd, 3, 0x80, 0, 0xc3, 3, 0x80]);
  });

  it('local label 3', function() {
    var js80 = new JS80();
    js80.asm('org 8000h\nmain:\ncall main.1\n.1: nop\njp .1');
    should(js80.image.build()).be.eql([0xcd, 3, 0x80, 0, 0xc3, 3, 0x80]);
  });

  it('empty code', function() {
    var js80 = new JS80();
    js80.asm('org 8000h\n');
    should(js80.image.build()).be.eql([]);
  });

  it('djnz label', function() {
    var js80 = new JS80();
    js80.asm('org 8000h\ntest: nop\ndjnz test');
    should(js80.image.build()).be.eql([0, 0x10, 0xfd]);
  });

  it('jr label', function() {
    var js80 = new JS80();
    js80.asm('org 8000h\njr test\nnop\ntest: nop');
    should(js80.image.build()).be.eql([0x18, 1, 0, 0]);
  });

  it('pepe equ 123\nld a,pepe', function() {
    var js80 = new JS80();
    js80.asm('pepe equ 123\nld a,pepe');
    should(js80.image.build()).be.eql([0x3e, 123]);
  });

  it('ld a,1<<1', function() {
    var js80 = new JS80();
    js80.asm('ld a,1<<1');
    should(js80.image.build()).be.eql([0x3e, 1<<1]);
  });

  it('ld a,1<<1+2', function() {
    var js80 = new JS80();
    js80.asm('ld a,1<<1+2');
    should(js80.image.build()).be.eql([0x3e, (1<<1)+2]);
  });

  it('org 8000h \n ld hl,$', function() {
    var js80 = new JS80();
    js80.asm('org 8000h\nld hl,$');
    should(js80.image.build()).be.eql([0x21, 0, 0x80]);
  });

  it('org 8000h \n ld hl,$+2', function() {
    var js80 = new JS80();
    js80.asm('org 8000h\nld hl,$+2');
    should(js80.image.build()).be.eql([0x21, 2, 0x80]);
  });

  it('modules', function() {
    var js80 = new JS80();
    js80.asm('org 8000h\nmodule m1\nl1: nop\nmodule m2\nl2: nop\nmodule m3\nld hl,m1.l1+m2.l2');
    should(js80.image.build()).be.eql([0,0,0x21,1,(0x80+0x80)&255]);
  });

  it('include', function() {
    var js80 = new JS80();
    js80.searchPath.push('examples');
    js80.asm('include "hello.asm"');
    should(js80.image.build().length).not.be.eql(0);
  });

  it('ds fill', function() {
    var js80 = new JS80();
    js80.asm('org 8000h\nnop\nds 0x8000+0x2000-$,0xff');
    var image = js80.image.build();
    should(image.length).be.eql(0x2000);
    should(image[1]).be.equal(255);
  });

  it('incbin', function() {
    var js80 = new JS80();
    js80.asm('incbin "examples/hello.asm"');
    should(js80.image.build().length).not.be.eql(0);
  });

  it('incbin len', function() {
    var js80 = new JS80();
    js80.asm('incbin "examples/hello.asm",10,10');
    should(js80.image.build().length).be.eql(10);
  });

  it('endmodule', function() {
    var js80 = new JS80();
    js80.asm('module test\nl1: nop\nendmodule\nl2: nop\nmodule test2\ncall test.l1\ncall l2');
    should(js80.image.build().length).not.be.eql([0,0,0xcd,0,0,0xcd,1,0]);
  });

  it('macro noargs', function() {
    var js80 = new JS80();
    js80.asm('macro test\nnop\nnop\nendmacro\ntest\ntest');
    should(js80.image.build().length).not.be.eql([0,0,0,0]);
  });

  it('macro with fixed args', function() {
    var js80 = new JS80();
    js80.asm('macro test arg1,arg2\nld a,arg1+arg2\nendmacro\ntest 1,2');
    should(js80.image.build().length).not.be.eql([0x3e, 1+2]);
  });

  it('macro with default args', function() {
    var js80 = new JS80();
    js80.asm('macro test arg1,arg2:10\nld a,arg1+arg2\nendmacro\ntest 1');
    should(js80.image.build().length).not.be.eql([0x3e, 1+10]);
  });

  it('ld string', function() {
    var js80 = new JS80();
    (function () {
      js80.asm('ld a,"jarl"');
    }).should.throw('Invalid argument');
  });

  it('ld char', function() {
    var js80 = new JS80();
    js80.asm("ld a,'a'");
    should(js80.image.build().length).not.be.eql([0x3e, 65]);
  });

  it('repeat', function() {
    var js80 = new JS80();
    js80.asm('repeat 2\nnop\nnop\nendrepeat');
    should(js80.image.build()).be.eql([0,0,0,0]);
  });

  it('repeat^2', function() {
    var js80 = new JS80();
    js80.asm('repeat 2\nrepeat 2\nnop\nendrepeat\nendrepeat');
    should(js80.image.build()).be.eql([0,0,0,0]);
  });

  it('macro with variable args', function() {
    var js80 = new JS80();
    js80.asm('macro test base,1..*\nrepeat @0\ndb base+@1\nrotate 1\nendrepeat\nendmacro\ntest 10,1,2,3');
    should(js80.image.build()).be.eql([11,12,13]);
  });

  it('map', function() {
    var js80 = new JS80();
    js80.asm('map 0xc000\ntest equ # 1\ntest2 equ # 2\nld hl,test\nld hl,test2');
    should(js80.image.build()).be.eql([0x21,0,0xc0,0x21,1,0xc0]);
  });

  it('or op', function() {
    var js80 = new JS80();
    js80.asm('ld a,1|2');
    should(js80.image.build()).be.eql([0x3e, 1|2]);
  });

  it('and op', function() {
    var js80 = new JS80();
    js80.asm('ld a,3&2');
    should(js80.image.build()).be.eql([0x3e, 3&2]);
  });

  it('xor op', function() {
    var js80 = new JS80();
    js80.asm('ld a,3^2');
    should(js80.image.build()).be.eql([0x3e, 3^2]);
  });

  it('hex $20', function() {
    var js80 = new JS80();
    js80.asm('ld a,$20');
    should(js80.image.build()).be.eql([0x3e, 0x20]);
  });

  it('hex 0x20', function() {
    var js80 = new JS80();
    js80.asm('ld a,0x20');
    should(js80.image.build()).be.eql([0x3e, 0x20]);
  });

  it('hex 20h', function() {
    var js80 = new JS80();
    js80.asm('ld a,20h');
    should(js80.image.build()).be.eql([0x3e, 0x20]);
  });

  it('bin 0b100', function() {
    var js80 = new JS80();
    js80.asm('ld a,0b100');
    should(js80.image.build()).be.eql([0x3e, 4]);
  });

  it('defpage 0', function() {
    var js80 = new JS80();
    js80.asm('defpage 0,0x4000,0x2000\\page 0\\ld hl,$');
    var image = js80.image.build();
    should(image.length).be.eql(0x2000);
    should(_.first(image, 3)).be.eql([0x21, 0, 0x40]);
  });

  it('dw label, 10', function() {
    var js80 = new JS80();
    js80.asm('dw start, 10\nstart:');
    should(js80.image.build()).be.eql([4, 0, 10, 0]);
  });

  it('no macro', function() {
    var js80 = new JS80();
    js80.asm('macro nop\n@@nop\n@@nop\nendmacro\nnop');
    should(js80.image.build()).be.eql([0, 0]);
  });

  it('invalid instr', function() {
    var js80 = new JS80();
    (function () {
      js80.asm('xor a,1"');
    }).should.throw();
  });

  it('multiple pages', function() {
    var js80 = new JS80();
    js80.asm('defpage 0,0,1\ndefpage 1,1,1\ndefpage 2,2,1\npage 0..2\ndb 1,2,3');
    should(js80.image.build()).be.eql([1,2,3]);
  });

  it('multiple defpages', function() {
    var js80 = new JS80();
    js80.asm('defpage 0..2,0,1\npage 0..2\ndb 1,2,3');
    should(js80.image.build()).be.eql([1,2,3]);
  });
});