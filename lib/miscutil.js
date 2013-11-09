'use strict';

// http://stackoverflow.com/questions/1985260/javascript-array-rotate
Array.prototype.rotate = (function() {
                            var unshift = Array.prototype.unshift;
                            var splice = Array.prototype.splice;

                            return function(count) {
                              var len = this.length >>> 0;
                              count = count >> 0;
                              unshift.apply(this, splice.call(this, count % len, len));
                              return this;
                            };
                          })();

module.exports.compl2 = function(v) {
  return (v<0) ? (256+v) : v;
}

module.exports.fill = function(len, value) {
  value = value||0;
  for(var a = []; len; len--) {
    a.push(value);
  }
  return a;
}
