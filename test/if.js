'use strict';

var should = require('should'),
    JS80 = require('../lib/js80');

describe('if', function() {
    it('ifdef', function() {
        var js80 = new JS80();
        js80.asm('test: equ 1\nifdef test\nnop\nendif');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0]);
    });

    it('ifdef else', function() {
        var js80 = new JS80();
        js80.asm('test: equ 1\nifdef test\nnop\nelse\nxor a\nendif');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0]);
    });

    it('ifdef else inf', function() {
        var js80 = new JS80();
        js80.asm('ifdef test\nnop\nelse\nxor a\nendif');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0xa8 + 7]);
    });

    it('ifndef', function() {
        var js80 = new JS80();
        js80.asm('test2: equ 1\nifndef test\nnop\nendif');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0]);
    });

    it('ifndef else', function() {
        var js80 = new JS80();
        js80.asm('test2: equ 1\nifndef test\nnop\nelse\nxor a\nendif');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0]);
    });

    it('ifndef else inf', function() {
        var js80 = new JS80();
        js80.asm('ifndef test\nnop\nelse\nxor a\nendif');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0]);
    });

    it('equal', function() {
        var js80 = new JS80();
        js80.asm('test: equ 1\nif test==1\nnop\nelse\nxor a\nendif');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0]);
    });

    it('nequal', function() {
        var js80 = new JS80();
        js80.asm('test: equ 1\nif test!=0\nnop\nelse\nxor a\nendif');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0]);
    });

    it('equal else', function() {
        var js80 = new JS80();
        js80.asm('test: equ 0\nif test==1\nnop\nelse\nxor a\nendif');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0xa8 + 7]);
    });

    it('nequal else', function() {
        var js80 = new JS80();
        js80.asm('test: equ 0\nif test!=0\nnop\nelse\nxor a\nendif');
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
        should(js80.buildImage()).be.eql([0xa8 + 7]);
    });
});
