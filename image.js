'use strict';

var _ = require('underscore');

function Image() {
  this.pages = {0:{origin:0, offset:0, output:[]}};
}

Image.prototype.build = function() {
  var buffer = [];
  _.each(this.pages, function(page) {
    buffer = buffer.concat(page.output);
  });
  return buffer;
}

module.exports = Image;
