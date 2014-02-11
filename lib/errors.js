var _ = require('underscore');

function Errors() {
    this.errors = [];
}

Errors.prototype.add = function (msg, env) {
    var macro = env.get('__macro__');
    var fileName = env.get('__filename__');
    var lineIndex = env.get('__lineIndex__');
    var macroLineIndex = env.get('__macroLineIndex__');
    var error = {
	msg: msg,
	macro: macro,
	fileName: fileName,
	lineIndex: lineIndex,
	macroLineIndex: macroLineIndex
    };
    this.errors.push(error);
};

function printMacroError(err) {
    console.error(
        '%s:%s: %s in macro %s:%s',
        err.fileName,
        err.lineIndex,
        err.msg,
        err.macro,
	err.macroLineIndex);
}

function printNoMacroError(err) {
    console.error('%s:%s: %s', err.fileName, err.lineIndex, err.msg);
}

function printError(err) {
    if (err.macro) {
	printMacroError(err);
    } else {
	printNoMacroError(err);
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
