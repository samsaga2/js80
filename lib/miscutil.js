'use strict';

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
