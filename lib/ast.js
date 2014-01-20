'use strict';

var _ = require('underscore');

var bodies = [];

function line(l) {
    if (bodies.length) {
        _.last(bodies).body.push(l);
        return [];
    }
    return l;
}

module.exports = {
    init: function () {
        bodies = [];
    },

    label: function (labelName, inst, lineIndex) {
        var body = [inst];
        if (labelName) {
            return line({label: labelName, body: body, line: lineIndex});
        } else {
            return line({body: body, line: lineIndex});
        }
    },

    equ: function (labelName, valueExpr, lineIndex) {
        return line({equ: {label: labelName, value: valueExpr}, line: lineIndex});
    },

    asmInst: function (asm, args, execMacro) {
        return {asm: {inst: asm, args: args, execmacro: execMacro}};
    },

    inst: function (labelName, inst, lineIndex) {
        return [
            {label: labelName, line: lineIndex},
            inst
        ];
    },

    org: function (valueXpr) {
        return {org: valueXpr};
    },

    map: function (valueExpr) {
        return {map: valueExpr};
    },

    defineSpace: function (lenExpr, valueExpr) {
        return {ds: {len: lenExpr, value: valueExpr}};
    },

    defineWords: function (valuesExpr) {
        return {dw: valuesExpr};
    },

    defineBytes: function (valuesExpr) {
        return {db: valuesExpr};
    },

    defineModule: function (moduleName) {
        return {module: moduleName};
    },

    endModule: function () {
        return {endmodule: true};
    },

    include: function (fileName) {
        return {include: fileName};
    },

    includeBinary: function (fileName, skipExpr, lenExpr) {
        return {incbin: {file: fileName, skip: skipExpr, len: lenExpr}};
    },

    rotate: function (numExpr) {
        return {rotate: numExpr};
    },

    definePage: function (pageIndexExpr, originExpr, sizeExpr) {
        return {defpage: {index: pageIndexExpr, origin: originExpr, size: sizeExpr}};
    },

    page: function (numExpr) {
        return {page: numExpr};
    },

    echo: function (valuesExpr) {
        return {echo: valuesExpr};
    },

    error: function (msg) {
        return {error: msg};
    },

    defineMacro: function (name, args) {
        var macro = {type: 'macro', id: name, args: args, body: []};
        bodies.push(macro);
        return {};
    },

    endMacro: function () {
        var m = bodies.pop();
        if (m.type === 'macro') {
            return {macro:m};
        }
        throw new Exception('Unexpected endmacro');
    },

    defineRepeat: function (numExpr) {
        var repeat = {type: 'repeat', count: numExpr, body: []};
        bodies.push(repeat);
        return {};
    },

    endRepeat: function () {
        var r = bodies.pop();
        if (r.type === 'repeat') {
            return {repeat:r};
        }
        throw new Exception('Unexpected endrepeat');
    },

    ifDef: function (identifier) {
        var iff = {type: 'if', defined: identifier, thenBody: []};
        iff.body = iff.thenBody;
        bodies.push(iff);
        return {};
    },

    ifNotDef: function (identifier) {
        var iff = {type: 'if', undefined: identifier, thenBody: []};
        iff.body = iff.thenBody;
        bodies.push(iff);
        return {};
    },

    if: function (condExpr) {
        var iff = {type: 'if', expr: condExpr, thenBody: []};
        iff.body = iff.thenBody;
        bodies.push(iff);
        return {};
    },

    else: function () {
        var iff = _.last(bodies);
        if (iff.type === 'if') {
            iff.elseBody = [];
            iff.body = iff.elseBody;
            return {};
        }
        throw new Exception('Unexpected else');
    },

    endIf: function () {
        var iff = bodies.pop();
        if (iff.type === 'if') {
            return {if:iff};
        }
        throw new Exception('Unexpected endif');
    },

    macroArgRange: function (startExpr, endExpr) {
        return {start: startExpr, end: endExpr};
    },

    macroArgRest: function () {
        return {rest: true};
    },

    macroArg: function (i, e) {
        return {id: i, default: e};
    },

    defineStruct: function (name) {
        var struct = {type: 'struct', name: name, body: []};
        bodies.push(struct);
        return {};
    },

    endStruct: function () {
        var r = bodies.pop();
        if (r.type === 'struct') {
            return {struct:r};
        }
        throw new Exception('Unexpected endstruct');
    },

    expr: {
        chr: function (c) {
            return {chr: c}
        },

        str: function (s) {
            return {str: s};
        },

        neg: function (e) {
            return {neg: e};
        },

        arg: function (e) {
            return {arg: e};
        },

        map: function (e) {
            return {map: e};
        },

        num: function (num) {
            return num;
        },

        id: function (id) {
            return {id: id};
        },

        here: function () {
            return {id: '$'};
        },

        paren: function (e) {
            return {paren: e};
        },

        binary: function (op, left, right) {
            return {binary: {op:op, args: [left, right]}};
        },

        func: function(id, args) {
            return {func: {id:id, args: args}};
        }
    }
};
