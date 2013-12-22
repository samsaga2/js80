'use strict';

var should = require('should'),
    JS80 = require('../lib/js80'),
    _ = require('underscore');

describe('macro', function() {
    it('noargs', function() {
        var js80 = new JS80();
        js80.asm('macro test\nnop\nnop\nendmacro\ntest\ntest');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.image.build().length).not.be.eql([0, 0, 0, 0]);
    });

    it('with fixed args', function() {
        var js80 = new JS80();
        js80.asm('macro test arg1,arg2\nld a,arg1+arg2\nendmacro\ntest 1,2');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.image.build().length).not.be.eql([0x3e, 1 + 2]);
    });

    it('with default args', function() {
        var js80 = new JS80();
        js80.asm('macro test arg1,arg2:10\nld a,arg1+arg2\nendmacro\ntest 1');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.image.build().length).not.be.eql([0x3e, 1 + 10]);
    });

    it('with variable args', function() {
        var js80 = new JS80();
        js80.asm('macro test base,1..*\nrepeat @0\ndb base+@1\nrotate 1\nendrepeat\nendmacro\ntest 10,1,2,3');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([11, 12, 13]);
    });

    it('if inside macro', function() {
        var js80 = new JS80();
        js80.asm('macro jarl\nifdef TEST\ndb 0\nelse\ndb 1\nendif\nendmacro\njarl');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([1]);
    });

    it('inside if', function() {
        var js80 = new JS80();
        js80.asm('TEST: equ 1\nifdef TEST\nmacro test2 tt\nld hl,tt\nendmacro\nendif\ntest2 msg\nmsg: db "hello"');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0x21, 3, 0, 104, 101, 108, 108, 111]);
    });

    it('override arg name', function() {
        var js80 = new JS80();
        js80.asm('arg: equ 10\nmacro test arg\nld hl,arg\nendmacro\ntest arg');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.true;
    });
});
