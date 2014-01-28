'use strict';

var should = require('should'),
    JS80 = require('../lib/js80'),
    _ = require('underscore');

describe('funcs', function() {
    it('org 8000h \n nop', function() {
        var js80 = new JS80();
        js80.asm('org 8000h\nnop');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0]);
        should(js80.image.currentPage.origin + js80.image.currentPage.offset).be.eql(0x8001);
    });

    it('db 1,2,3', function() {
        var js80 = new JS80();
        js80.asm('db 1,2,3');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([1, 2, 3]);
    });

    it('db "hello", 0', function() {
        var js80 = new JS80();
        js80.asm('db "hello", 0');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([104,101,108,108,111,0]);
    });

    it('dw 1,2,3', function() {
        var js80 = new JS80();
        js80.asm('dw 1,2,3');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([1, 0, 2, 0, 3, 0]);
    });

    it('ds 5', function() {
        var js80 = new JS80();
        js80.asm('ds 5');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0, 0, 0, 0, 0]);
    });

    it('db "hello", 0', function() {
        var js80 = new JS80();
        js80.asm('db "hello", 0');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([104, 101, 108, 108, 111, 0]);
    });

    it('pepe equ 123\nld a,pepe', function() {
        var js80 = new JS80();
        js80.asm('pepe: equ 123\nld a,pepe');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0x3e, 123]);
    });

    it('modules', function() {
        var js80 = new JS80();
        js80.asm('org 8000h\nmodule m1\nl1: nop\nmodule m2\nl2: nop\nmodule m3\nld hl,m1.l1\nld hl,m2.l2');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0, 0, 0x21, 0, 0x80, 0x21, 1, 0x80]);
    });

    it('include', function() {
        var js80 = new JS80();
        js80.searchPath.push('examples');
        js80.asm('include "../test/test.asm"');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.image.build().length).not.be.eql(0, 0);
    });

    it('ds fill', function() {
        var js80 = new JS80();
        js80.asm('org 8000h\nnop\nds 0x8000+0x2000-$,0xff');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        var image = js80.image.build();
        should(image.length).be.eql(0x2000);
        should(image[1]).be.equal(255);
    });

    it('incbin', function() {
        var js80 = new JS80();
        js80.asm('incbin "examples/hello16k.asm"');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.image.build().length).not.be.eql(0);
    });

    it('incbin len', function() {
        var js80 = new JS80();
        js80.asm('incbin "examples/hello16k.asm",10,10');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.image.build().length).be.eql(10);
    });

    it('endmodule', function() {
        var js80 = new JS80();
        js80.asm('module test\nl1: nop\nendmodule\nl2: nop\nmodule test2\ncall test.l1\ncall l2');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.image.build().length).not.be.eql([0, 0, 0xcd, 0, 0, 0xcd, 1, 0]);
    });

    it('repeat', function() {
        var js80 = new JS80();
        js80.asm('repeat 2\nnop\nnop\nendrepeat');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0, 0, 0, 0]);
    });

    it('repeat^2', function() {
        var js80 = new JS80();
        js80.asm('repeat 2\nrepeat 2\nnop\nendrepeat\nendrepeat');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0, 0, 0, 0]);
    });

    it('map', function() {
        var js80 = new JS80();
        js80.asm('map 0xc000\ntest: equ # 1\ntest2: equ # 2\nld hl,test\nld hl,test2');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0x21, 0, 0xc0, 0x21, 1, 0xc0]);
    });

    it('defpage 0', function() {
        var js80 = new JS80();
        js80.asm('defpage 0,0x4000,0x2000\\page 0\\ld hl,$');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        var image = js80.image.build();
        should(image.length).be.eql(0x2000);
        should(_.first(image, 3)).be.eql([0x21, 0, 0x40]);
    });

    it('dw label, 10', function() {
        var js80 = new JS80();
        js80.asm('dw start, 10\nstart:');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([4, 0, 10, 0]);
    });

    it('no macro', function() {
        var js80 = new JS80();
        js80.asm('macro nop\n@@nop\n@@nop\nendmacro\nnop');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0, 0]);
    });

    it('multiple pages', function() {
        var js80 = new JS80();
        js80.asm('defpage 0,0,1\ndefpage 1,1,1\ndefpage 2,2,1\npage 0..2\ndb 1,2,3');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([1, 2, 3]);
    });

    it('multiple defpages', function() {
        var js80 = new JS80();
        js80.asm('defpage 0..2,0,1\npage 0..2\ndb 1,2,3');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([1, 2, 3]);
    });

    it('error', function() {
        var js80 = new JS80();
        js80.asm('error "jarl"');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.true;
    });

    it('struct', function() {
        var js80 = new JS80();
        js80.asm('struct test\nv1: equ # 1\nv2: equ # 2\nendstruct\ndb test.v1, test.v2, test.size');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0, 1, 3]);
    });

    it('module struct', function() {
        var js80 = new JS80();
        js80.asm('module m1\nstruct test\nv1: equ # 1\nv2: equ # 2\nendstruct\nendmodule\ndb test.v1, test.v2, test.size');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0, 1, 3]);
    });

    it('struct map', function() {
        var js80 = new JS80();
        js80.asm('map 100\nstruct test\nv1: equ # 1\nv2: equ # 2\nendstruct\npp: equ # 3\ndb test.v1, test.v2, test.size, pp');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0, 1, 3, 100]);
    });

    it('struct shortcut map', function() {
        var js80 = new JS80();
        js80.asm('map 100\nstruct test\nv1: # 1\nv2: # 2\nendstruct\npp: # 3\ndb test.v1, test.v2, test.size, pp');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0, 1, 3, 100]);
    });

    it('code', function() {
        var js80 = new JS80();
        js80.asm('org 8000h\ncode\nnop');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0]);
        should(js80.image.currentPage.origin + js80.image.currentPage.offset).be.eql(0x8001);
    });

    it('data', function() {
        var js80 = new JS80();
        js80.asm('org 8000h\ndata\nnop');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0]);
        should(js80.image.currentPage.origin + js80.image.currentPage.offset).be.eql(0x8001);
    });
});
