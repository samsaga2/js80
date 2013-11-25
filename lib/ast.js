'use strict';

var _ = require('underscore');

var macro = null;

module.exports = {
    line: function (l) {
        if (macro) {
            macro.body.push(l);
            return [];
        }
        return l;
    },

    label: function (labelName, body, lineIndex) {
        if (labelName) {
            return {label: labelName, body: body, line: lineIndex};
        } else {
            return {body: body, line: lineIndex};
        }
    },

    equ: function (labelName, valueExpr, lineIndex) {
        return {equ: {label: labelName, value: valueExpr}, line: lineIndex};
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

    defineMacro: function(name, args) {
        if(macro) {
            throw new Error('Forbidden macro declaration');
        }
        macro = {id:name, args:args, body:[]};
        return {};
    },

    endMacro: function() {
        var m = macro;
        macro = null;
        return {macro:m};
    },

    macro: {
        range: function (startExpr, endExpr) {
            return {start: startExpr, end: endExpr};
        },

        rest: function () {
            return {rest: true};
        },

        arg: function (i, e) {
            return {id: i, default: e};
        }
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

        binaryOperator: function (op, left, right) {
            return {binary: op, args: [left, right]};
        }
    }
};
