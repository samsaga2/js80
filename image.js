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

Image.prototype.compl2 = function(v) {
  return (v<0) ? (256+v) : v;
}

Image.prototype.write = function(bytes, pageIndex) {
    bytes = _.map(bytes, this.compl2, this);
    var page = this.pages[pageIndex];
    page.output = page.output.concat(bytes);
}

Image.prototype.build = function() {
  var buffer = [];
  _.each(this.pages, function(page) {
    buffer = buffer.concat(page.output);
  });
  return buffer;
}

module.exports = Image;
