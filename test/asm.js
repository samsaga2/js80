'use strict';

var should = require('should'),
    JS80 = require('../lib/js80');

describe('asm', function() {
    it('nop', function() {
        var js80 = new JS80();
        js80.asm('nop');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0]);
    });

    it('ret', function() {
        var js80 = new JS80();
        js80.asm('ret');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0xc9]);
    });

    it('xor a', function() {
        var js80 = new JS80();
        js80.asm('xor a');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0xa8 + 7]);
    });

    it('ld a,1', function() {
        var js80 = new JS80();
        js80.asm('ld a,1');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0x3e, 1]);
    });

    it('ld a,l', function() {
        var js80 = new JS80();
        js80.asm('ld a,l');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0x78 + 5]);
    });

    it('ld b,(hl)', function() {
        var js80 = new JS80();
        js80.asm('ld b,(hl)');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0x46]);
    });

    it('set 2,(ix+10)', function() {
        var js80 = new JS80();
        js80.asm('set 2,(ix+10)');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0xdd, 0xcb, 10, 0xc6 + 8 * 2]);
    });

    it('out (0x98),a \n or 5', function() {
        var js80 = new JS80();
        js80.asm('out (0x98),a\nor 5');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0xd3, 0x98, 0xf6, 5]);
    });

    it(';; comment', function() {
        var js80 = new JS80();
        js80.asm(';; comment');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.image.build().length).be.eql(0);
    });

    it('nop // comment', function() {
        var js80 = new JS80();
        js80.asm('nop // comment');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0]);
    });

    it('nop ; comment', function() {
        var js80 = new JS80();
        js80.asm('nop ; comment');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0]);
    });

    it('nop /* ... */', function() {
        var js80 = new JS80();
        js80.asm('nop /* comment\ncomment 2\ncomment3\n*/\nnop');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0, 0]);
    });

    it('label', function() {
        var js80 = new JS80();
        js80.asm('org 8000h\ntest_label: nop');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.environment.get('test_label')).be.eql(0x8000);
    });

    it('multiple inst per line', function() {
        var js80 = new JS80();
        js80.asm('nop\\test: xor a\\ret');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0, 0xa8 + 7, 0xc9]);
    });

    it('call label', function() {
        var js80 = new JS80();
        js80.asm('org 8000h\ntest_label: nop\ncall test_label');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0, 0xcd, 0, 0x80]);
    });

    it('jp label', function() {
        var js80 = new JS80();
        js80.asm('org 8000h\ntest_label: nop\njp test_label');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0, 0xc3, 0, 0x80]);
    });

    it('label second pass', function() {
        var js80 = new JS80();
        js80.asm('org 8000h\nmain: call test_label\ntest_label: nop\njp main');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0xcd, 3, 0x80, 0, 0xc3, 0, 0x80]);
    });

    it('local label', function() {
        var js80 = new JS80();
        js80.asm('org 8000h\nmain:\ncall main.test_label\n.test_label: nop\njp main');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0xcd, 3, 0x80, 0, 0xc3, 0, 0x80]);
    });

    it('local label 2', function() {
        var js80 = new JS80();
        js80.asm('org 8000h\nmain:\ncall main.test_label\n.test_label: nop\njp .test_label');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0xcd, 3, 0x80, 0, 0xc3, 3, 0x80]);
    });

    it('local label 3', function() {
        var js80 = new JS80();
        js80.asm('org 8000h\nmain:\ncall main.1\n.1: nop\njp .1');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0xcd, 3, 0x80, 0, 0xc3, 3, 0x80]);
    });

    it('empty code', function() {
        var js80 = new JS80();
        js80.asm('org 8000h\n');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([]);
    });

    it('djnz label', function() {
        var js80 = new JS80();
        js80.asm('org 8000h\ntest: nop\ndjnz test');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0, 0x10, 0xfd]);
    });

    it('jr label', function() {
        var js80 = new JS80();
        js80.asm('org 8000h\njr test\nnop\ntest: nop');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0x18, 1, 0, 0]);
    });

    it('invalid instr', function() {
        var js80 = new JS80();
        js80.asm('xor a,1"');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.true;
    });

    it('ld (0x1020),a', function() {
        var js80 = new JS80();
        js80.asm('var: equ 0x1020\nld (var),a');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0x32, 0x20, 0x10]);
    });

    it('ld (0x1020),a', function() {
        var js80 = new JS80();
        js80.asm('ld (var),a\nvar: equ 0x1020');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0x32, 0x20, 0x10]);
    });
});
