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

  this.page = 0;
}

Image.prototype.write = function(bytes) {
  var page = this.pages[this.page];

  // write
  bytes = _.map(bytes, miscutil.compl2, this);
  page.output = page.output.concat(bytes);

  // advance
  page.offset += bytes.length;
  if(page.size > 0 && page.offset > page.size) {
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
