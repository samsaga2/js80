'use strict';

var _ = require('underscore'),
    Page = require('./page');

function Image() {
    this.pages = [];
    for(var i = 0; i < 256; i++) {
        this.pages.push(new Page());
    }
    this.selectPage([0]);
}

Image.prototype.selectPage = function (n) {
    this.pageRange = _.rest(n);
    this.pageIndex = _.first(n);
    this.currentPage = this.pages[this.pageIndex];
};

Image.prototype.selectNextPageInRange = function() {
    this.pageIndex = _.first(this.pageRange);
    this.currentPage = this.pages[this.pageIndex];
    this.pageRange = _.rest(this.pageRange);
};

Image.prototype.here = function () {
    return this.currentPage.here();
};

Image.prototype.writeByte = function (value) {
    if (this.currentPage.isFull()) {
        throw new Error('Page overflow');
    }
    this.currentPage.writeByte(value);
    if (this.currentPage.isFull() && this.pageRange.length) {
	this.selectNextPageInRange();
    }
};

Image.prototype.write = function (bytes) {
    _.each(bytes, this.writeByte, this);
};

Image.prototype.build = function () {
    var buffer = [];
    _.each(this.pages, function (page) {
        buffer = buffer.concat(page.build());
    });
    return buffer;
};

module.exports = Image;
