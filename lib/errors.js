var _ = require('underscore');

function Errors() {
    this.errors = [];
}

Errors.prototype.add = function (msg, macro, lineIndex, fileName, macroLineIndex) {
    var error = {
	msg: msg,
	macro: macro,
	fileName: fileName,
	lineIndex: lineIndex,
	macroLineIndex: macroLineIndex
    };
    this.errors.push(error);
};

function printError(err) {
    if (err.macro) {
        console.error(
            '%s:%s: %s in macro %s:%s',
            err.fileName,
            err.lineIndex,
            err.msg,
            err.macro,
	    err.macroLineIndex);
    } else {
        console.error('%s:%s: %s', err.fileName, err.lineIndex, err.msg);
    }
}

Errors.prototype.print = function () {
    _.chain(this.errors)
        .sortBy('msg')
        .sortBy('lineIndex')
        .sortBy('macro')
        .sortBy('fileName')
        .each(printError);
};

Errors.prototype.hasErrors = function () {
    return this.errors.length !== 0;
};

module.exports = Errors;
