'use strict';

var should = require('should'),
    JS80 = require('../lib/js80');

describe('asm', function() {
    it('nop', function() {
        var js80 = new JS80();
        js80.asm('nop');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0]);
    });

    it('ret', function() {
        var js80 = new JS80();
        js80.asm('ret');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0xc9]);
    });

    it('xor a', function() {
        var js80 = new JS80();
        js80.asm('xor a');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0xa8 + 7]);
    });

    it('ld a,1', function() {
        var js80 = new JS80();
        js80.asm('ld a,1');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0x3e, 1]);
    });

    it('ld a,l', function() {
        var js80 = new JS80();
        js80.asm('ld a,l');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0x78 + 5]);
    });

    it('ld b,(hl)', function() {
        var js80 = new JS80();
        js80.asm('ld b,(hl)');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0x46]);
    });

    it('set 2,(ix+10)', function() {
        var js80 = new JS80();
        js80.asm('set 2,(ix+10)');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0xdd, 0xcb, 10, 0xc6 + 8 * 2]);
    });

    it('out (0x98),a \n or 5', function() {
        var js80 = new JS80();
        js80.asm('out (0x98),a\nor 5');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0xd3, 0x98, 0xf6, 5]);
    });

    it(';; comment', function() {
        var js80 = new JS80();
        js80.asm(';; comment');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build().length).be.eql(0);
    });

    it('nop // comment', function() {
        var js80 = new JS80();
        js80.asm('nop // comment');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0]);
    });

    it('nop ; comment', function() {
        var js80 = new JS80();
        js80.asm('nop ; comment');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0]);
    });

    it('nop /* ... */', function() {
        var js80 = new JS80();
        js80.asm('nop /* comment\ncomment 2\ncomment3\n*/\nnop');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0, 0]);
    });

    it('label', function() {
        var js80 = new JS80();
        js80.asm('org 8000h\ntest_label: nop');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0]);
        should(js80.environment.get('test_label')).be.eql(0x8000);
    });

    it('multiple inst per line', function() {
        var js80 = new JS80();
        js80.asm('nop\\test: xor a\\ret');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0, 0xa8 + 7, 0xc9]);
    });

    it('call label', function() {
        var js80 = new JS80();
        js80.asm('org 8000h\ntest_label: nop\ncall test_label');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0, 0xcd, 0, 0x80]);
    });

    it('jp label', function() {
        var js80 = new JS80();
        js80.asm('org 8000h\ntest_label: nop\njp test_label');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0, 0xc3, 0, 0x80]);
    });

    it('label second pass', function() {
        var js80 = new JS80();
        js80.asm('org 8000h\nmain: call test_label\ntest_label: nop\njp main');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0xcd, 3, 0x80, 0, 0xc3, 0, 0x80]);
    });

    it('local label', function() {
        var js80 = new JS80();
        js80.asm('org 8000h\nmain:\ncall main.test_label\n.test_label: nop\njp main');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0xcd, 3, 0x80, 0, 0xc3, 0, 0x80]);
    });

    it('local label 2', function() {
        var js80 = new JS80();
        js80.asm('org 8000h\nmain:\ncall main.test_label\n.test_label: nop\njp .test_label');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0xcd, 3, 0x80, 0, 0xc3, 3, 0x80]);
    });

    it('local label 3', function() {
        var js80 = new JS80();
        js80.asm('org 8000h\nmain:\ncall main.1\n.1: nop\njp .1');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0xcd, 3, 0x80, 0, 0xc3, 3, 0x80]);
    });

    it('empty code', function() {
        var js80 = new JS80();
        js80.asm('org 8000h\n');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([]);
    });

    it('djnz label', function() {
        var js80 = new JS80();
        js80.asm('org 8000h\ntest: nop\ndjnz test');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0, 0x10, 0xfd]);
    });

    it('jr label', function() {
        var js80 = new JS80();
        js80.asm('org 8000h\njr test\nnop\ntest: nop');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0x18, 1, 0, 0]);
    });

    it('invalid instr', function() {
        var js80 = new JS80();
        js80.asm('xor a,1"');
        should(js80.errors.length).be.eql(1);
    });
});