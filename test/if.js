'use strict';

var should = require('should'),
    JS80 = require('../lib/js80');

describe('if', function() {
    it('ifdef', function() {
        var js80 = new JS80();
        js80.asm('test equ 1\nifdef test\nnop\nendif');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0]);
    });

    it('ifdef else', function() {
        var js80 = new JS80();
        js80.asm('test equ 1\nifdef test\nnop\nelse\nxor a\nendif');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0]);
    });

    it('ifdef else inf', function() {
        var js80 = new JS80();
        js80.asm('ifdef test\nnop\nelse\nxor a\nendif');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0xa8 + 7]);
    });

    it('ifndef', function() {
        var js80 = new JS80();
        js80.asm('test2 equ 1\nifndef test\nnop\nendif');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0]);
    });

    it('ifndef else', function() {
        var js80 = new JS80();
        js80.asm('test2 equ 1\nifndef test\nnop\nelse\nxor a\nendif');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0]);
    });

    it('ifndef else inf', function() {
        var js80 = new JS80();
        js80.asm('ifndef test\nnop\nelse\nxor a\nendif');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0]);
    });

    it('if equal', function() {
        var js80 = new JS80();
        js80.asm('test equ 1\nif test==1\nnop\nelse\nxor a\nendif');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0]);
    });

    it('if nequal', function() {
        var js80 = new JS80();
        js80.asm('test equ 1\nif test!=0\nnop\nelse\nxor a\nendif');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0]);
    });

    it('if equal else', function() {
        var js80 = new JS80();
        js80.asm('test equ 0\nif test==1\nnop\nelse\nxor a\nendif');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0xa8 + 7]);
    });

    it('if nequal else', function() {
        var js80 = new JS80();
        js80.asm('test equ 0\nif test!=0\nnop\nelse\nxor a\nendif');
        should(js80.errors.length).be.eql(0);
        should(js80.image.build()).be.eql([0xa8 + 7]);
    });
});