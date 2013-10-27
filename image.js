'use strict';

var _ = require('underscore');

function Image() {
  this.pages = [];
  _.each(_.range(256), function() {
    this.pages.push({
        origin:0,
        offset:0,
        output:[]
    });
  }, this);
}

Image.prototype.build = function() {
  var buffer = [];
  _.each(this.pages, function(page) {
    buffer = buffer.concat(page.output);
  });
  return buffer;
}

module.exports = Image;
