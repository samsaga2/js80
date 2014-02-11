'use strict';

var _ = require('underscore'),
    miscutil = require('./miscutil');

function Page() {
    this.origin = 0;
    this.size = 0;
    this.output = [];
}

Page.prototype.here = function() {
    return this.output.length + this.origin;
};

Page.prototype.isFull = function() {
    return this.size > 0 && this.output.length >= this.size;
};

Page.prototype.writeByte = function(value) {
    this.output.push(miscutil.compl2(value));
};

Page.prototype.setByte = function(offset, value) {
    this.output[offset] = miscutil.compl2(value & 255);
};

Page.prototype.setWord = function(offset, value) {
    this.output[offset] = miscutil.compl2(value & 255);
    this.output[offset + 1] = miscutil.compl2((value >> 8) & 255);
};

Page.prototype.getFreeSpace = function() {
    return Math.max(0, this.size - this.output.length);
};

Page.prototype.build = function() {
    var left = this.getFreeSpace();
    if (left > 0) {
        return this.output.concat(miscutil.fill(left, 0));
    } else {
	return _.clone(this.output);
    }
};

module.exports = Page;
