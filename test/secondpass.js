'use strict';

var should = require('should'),
    JS80 = require('../lib/js80');

describe('second pass', function() {
    it('forward equ', function() {
        var js80 = new JS80();
        js80.asm('ld hl,crlf\nxor a\ncrlf: equ 69');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0x21, 69, 0, 0xa8 + 7]);
    });

    it('forward label', function() {
        var js80 = new JS80();
        js80.asm('ld hl,crlf\nxor a\ncrlf: nop');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0x21, 4, 0, 0xa8 + 7, 0]);
    });

    it('forward local label', function() {
        var js80 = new JS80();
        js80.asm('ld hl,test.1\ntest: xor a\n.1: nop');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0x21, 4, 0, 0xa8 + 7, 0]);
    });

    it('forward local label 2', function() {
        var js80 = new JS80();
        js80.asm('test: ld hl,.1\nxor a\n.1: nop');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0x21, 4, 0, 0xa8 + 7, 0]);
    });

    it('forward local label 2', function() {
        var js80 = new JS80();
        js80.asm('test: ld hl,.1\nxor a\n.1: nop');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0x21, 4, 0, 0xa8 + 7, 0]);
    });

    it('forward module local label', function() {
        var js80 = new JS80();
        js80.asm('module mtest\nld hl,test.1\ntest: xor a\n.1: nop\nendmodule');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0x21, 4, 0, 0xa8 + 7, 0]);
    });
});
