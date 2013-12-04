var _ = require('underscore');

function Errors() {
    this.errors = [];
}

Errors.prototype.add = function (msg, macro, lineIndex, fileName) {
    var error = {msg: msg, macro: macro, fileName: fileName, lineIndex: lineIndex};
    this.errors.push(error);
};

function printError(err) {
    if (err.macro) {
        console.error(
            '%s:%s: %s while executing macro %s',
            err.fileName,
            err.lineIndex,
            err.msg,
            err.macro);
    } else {
        console.error('%s:%s: %s', err.fileName, err.lineIndex, err.msg);
    }
}

Errors.prototype.print = function () {
    _.each(this.errors, printError);
};

Errors.prototype.hasErrors = function () {
    return this.errors.length !== 0;
};

module.exports = Errors;
