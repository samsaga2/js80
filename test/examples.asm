'use strict';

var should = require('should'),
    JS80 = require('../lib/js80'),
    _ = require('underscore');

describe('examples', function() {
    it('hello16k', function() {
        var js80 = new JS80();
        js80.include("examples/hello16k.asm");
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
    });

    it('hello32k', function() {
        var js80 = new JS80();
        js80.include("examples/hello32k.asm");
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
    });

    it('hellomega', function() {
        var js80 = new JS80();
        js80.include("examples/hellomega.asm");
        js80.secondPass();
        should(js80.errors.hasErrors()).be.false;
    });
});
