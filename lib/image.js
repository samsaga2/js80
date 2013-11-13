'use strict';

var _ = require('underscore'),
    miscutil = require('./miscutil');

function Image() {
    this.pages = [];
    _.each(_.range(256), function() {
        this.pages.push({
            origin: 0,
            offset: 0,
            size: 0,
            output: []
        });
    }, this);
    this.selectPage([0]);
}

Image.prototype.selectPage = function(n) {
    this.pageRange = _.rest(n);
    this.pageIndex = _.first(n);
    this.page = this.pages[this.pageIndex];
};

Image.prototype.here = function() {
    return this.page.offset + this.page.origin;
};

Image.prototype.writeByte = function(value) {
    if(this.page.size > 0 && this.page.offset >= this.page.size) {
        throw new Error('Page overflow');
    }

    this.page.output.push(miscutil.compl2(value));

    this.page.offset++;
    if(this.page.size > 0 && this.page.offset >= this.page.size && this.pageRange.length) {
        // select next page
        this.pageIndex = _.first(this.pageRange);
        this.page = this.pages[this.pageIndex];
        this.pageRange = _.rest(this.pageRange);
    }
};

Image.prototype.write = function(bytes) {
    _.each(bytes, this.writeByte, this);
};

Image.prototype.build = function() {
    var buffer = [];
    _.each(this.pages, function(page) {
        buffer = buffer.concat(page.output);
        var left = Math.max(0, page.size - page.output.length);
        if(left > 0) {
            buffer = buffer.concat(miscutil.fill(left, 0));
        }
    });
    return buffer;
};

module.exports = Image;
