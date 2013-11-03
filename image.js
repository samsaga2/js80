'use strict';

var _ = require('underscore')
  , miscutil = require('./miscutil');

function Image() {
  this.pages = [];
  _.each(_.range(256), function() {
    this.pages.push({
      origin:0,
      offset:0,
      size:0,
      output:[]
    });
  }, this);
  this.selectPage(0);
}

Image.prototype.selectPage = function(n) {
  this.pageIndex = n;
  this.page = this.pages[n];
}

Image.prototype.here = function() {
  return this.page.offset + this.page.origin;
}

Image.prototype.write = function(bytes) {
  // write
  bytes = _.map(bytes, miscutil.compl2, this);
  this.page.output = this.page.output.concat(bytes);

  // advance
  this.page.offset += bytes.length;
  if(this.page.size > 0 && this.page.offset > this.page.size) {
    throw new Error('Page overflow');
  }
}

Image.prototype.build = function() {
  var buffer = [];
  _.each(this.pages, function(page) {
    buffer = buffer.concat(page.output);
    var left = Math.max(0, page.size - page.output.length);
    if(left>0) {
      buffer = buffer.concat(miscutil.fill(left, 0));
    }
  });
  return buffer;
}

module.exports = Image;
