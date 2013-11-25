'use strict';

var should = require('should'),
    JS80 = require('../lib/js80');

describe('expr', function() {
    it('set 2,(iy+10+1+2)', function() {
        var js80 = new JS80();
        js80.asm('set 2,(iy+10+1+2)');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0xfd, 0xcb, 10 + 1 + 2, 0xc6 + 8 * 2]);
    });

    it('set 2,(iy-10-1-2)', function() {
        var js80 = new JS80();
        js80.asm('set 2,(iy-10-1-2)');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0xfd, 0xcb, 256 + (-10 - 1 - 2), 0xc6 + 8 * 2]);
    });

    it('ld a,1+2+3', function() {
        var js80 = new JS80();
        js80.asm('ld a,1+2+3');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x3e, 1 + 2 + 3]);
    });

    it('ld a,3-2-1', function() {
        var js80 = new JS80();
        js80.asm('ld a,3-2-1');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x3e, 3 - 2 - 1]);
    });

    it('ld a,10+1-4+5', function() {
        var js80 = new JS80();
        js80.asm('ld a,10+1-4+5');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x3e, 10 + 1 - 4 + 5]);
    });

    it('ld a,2*3+4*5', function() {
        var js80 = new JS80();
        js80.asm('ld a,2*3+4*5');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x3e, 2 * 3 + 4 * 5]);
    });

    it('ld a,(1+2)-3', function() {
        var js80 = new JS80();
        js80.asm('ld a,(1+2)-3');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x3e, (1 + 2) - 3]);
    });

    it('ld a,(1+2)-(3+4)', function() {
        var js80 = new JS80();
        js80.asm('ld a,(1+2)-(3+4)');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x3e, 256 + ((1 + 2) - (3 + 4))]);
    });

    it('ld a,1<<1', function() {
        var js80 = new JS80();
        js80.asm('ld a,1<<1');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x3e, 1 << 1]);
    });

    it('ld a,1<<1+2', function() {
        var js80 = new JS80();
        js80.asm('ld a,1<<1+2');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x3e, (1 << 1) + 2]);
    });

    it('$', function() {
        var js80 = new JS80();
        js80.asm('org 8000h\nld hl,$\nld hl,$');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x21, 0, 0x80, 0x21, 3, 0x80]);
    });

    it('ld string', function() {
        var js80 = new JS80();
        js80.asm('ld a,"jarl"');
        js80.secondPass();
    });

    it('ld char', function() {
        var js80 = new JS80();
        js80.asm("ld a,'a'");
        js80.secondPass();
        should(js80.image.build().length).not.be.eql([0x3e, 65]);
    });

    it('or op', function() {
        var js80 = new JS80();
        js80.asm('ld a,1|2');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x3e, 1 | 2]);
    });

    it('and op', function() {
        var js80 = new JS80();
        js80.asm('ld a,3&2');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x3e, 3 & 2]);
    });

    it('xor op', function() {
        var js80 = new JS80();
        js80.asm('ld a,3^2');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x3e, 3 ^ 2]);
    });

    it('hex $20', function() {
        var js80 = new JS80();
        js80.asm('ld a,$20');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x3e, 0x20]);
    });

    it('hex 0x20', function() {
        var js80 = new JS80();
        js80.asm('ld a,0x20');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x3e, 0x20]);
    });

    it('hex 20h', function() {
        var js80 = new JS80();
        js80.asm('ld a,20h');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x3e, 0x20]);
    });

    it('bin 0b100', function() {
        var js80 = new JS80();
        js80.asm('ld a,0b100');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x3e, 4]);
    });

    it('== true', function() {
        var js80 = new JS80();
        js80.asm('ld a,0==0');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x3e, 1]);
    });

    it('== false', function() {
        var js80 = new JS80();
        js80.asm('ld a,0==1');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x3e, 0]);
    });

    it('!= false', function() {
        var js80 = new JS80();
        js80.asm('ld a,0!=0');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x3e, 0]);
    });

    it('!= true', function() {
        var js80 = new JS80();
        js80.asm('ld a,0!=1');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x3e, 1]);
    });

    it('and eq', function() {
        var js80 = new JS80();
        js80.asm('ld a,0==0 & 1==1');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x3e, 1]);
    });

    it('< false', function() {
        var js80 = new JS80();
        js80.asm('ld a,0<0');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x3e, 0]);
    });

    it('< true', function() {
        var js80 = new JS80();
        js80.asm('ld a,0<1');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x3e, 1]);
    });

    it('> false', function() {
        var js80 = new JS80();
        js80.asm('ld a,0>0');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x3e, 0]);
    });

    it('> true', function() {
        var js80 = new JS80();
        js80.asm('ld a,1>0');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x3e, 1]);
    });

    it('<= false', function() {
        var js80 = new JS80();
        js80.asm('ld a,1<=0');
        should(js80.buildImage()).be.eql([0x3e, 0]);
    });

    it('<= true', function() {
        var js80 = new JS80();
        js80.asm('ld a,0<=1');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x3e, 1]);
    });

    it('>= false', function() {
        var js80 = new JS80();
        js80.asm('ld a,0>=1');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x3e, 0]);
    });

    it('>= true', function() {
        var js80 = new JS80();
        js80.asm('ld a,1>=0');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x3e, 1]);
    });

    it('forward label', function() {
        var js80 = new JS80();
        js80.asm('org $8000\nld hl,label\nlabel: nop');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x21, 3, 0x80, 0]);
    });

    it('forward expr', function() {
        var js80 = new JS80();
        js80.asm('org $8000\nld hl,label+l2\nlabel: nop\nl2: equ 1');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x21, 4, 0x80, 0]);
    });

    it('forward str', function() {
        var js80 = new JS80();
        js80.asm('org $8000\nld hl,text\ntext: db "hello", 0');
        js80.secondPass();
        should(js80.buildImage()).be.eql([0x21, 3, 0x80, 104, 101, 108, 108, 111, 0]);
    });
});
