'use strict';

var util = require('util'),
    evalExpr = require('./expr').evalExpr,
    z80parser = require('./z80parser'),
    _ = require('underscore');

var forwardExpr;

function isRegister(id) {
    var regs = [
        "AF", "BC", "DE", "HL", "IX", "IY", "SP", "R", "I",
        "A", "F", "B", "C", "D", "E", "H", "L", "IXL", "IXH", "IYL", "IYH",
        "C", "M", "NC", "NZ", "P", "PE", "PO", "Z"
    ];
    return _.any(regs, function (i) {
        return i === id.toUpperCase();
    });
}

function isArgParenNumber(arg) {
    return arg.paren && _.isNumber(arg.paren);
}

function isArgParenRegister(arg) {
    return arg.paren && arg.paren.id && isRegister(arg.paren.id);
}

function isArgParenOffset(arg) {
    return arg.paren && arg.paren.binary && arg.paren.binary.op === '+' && ['ix', 'iy'].indexOf(arg.paren.binary.args[0].id.toString().toLowerCase()) > -1;
}

function formatArg(arg, env) {
    if (arg.str) {
        throw new Error('Invalid argument');
    }

    if (isArgParenNumber(arg)) {
        return util.format('(%d)', arg.paren);
    }

    if (isArgParenRegister(arg)) {
        return util.format('(%s)', arg.paren.id);
    }

    if (isArgParenOffset(arg)) {
        var offsetReg = arg.paren.binary.args[0].id.toString().toLowerCase();
        var offsetExpr = {binary: {op: arg.paren.binary.op, args: _.rest(arg.paren.binary.args)}};
        var offsetValue = evalExpr(offsetExpr, env);
        if (offsetValue < 0) {
            return util.format('(%s%d)', offsetReg, offsetValue);
        } else {
            return util.format('(%s+%d)', offsetReg, offsetValue);
        }
    }

    if (arg.paren) {
        return formatArg(arg.paren, env);
    }

    try {
        var value = evalExpr(arg, env);
        if (_.isNumber(value)) {
            return value.toString();
        }
    } catch (e) {
    }

    if ('id' in arg && isRegister(arg.id)) {
        return arg.id;
    }

    forwardExpr = arg;
    return '$nn';
}

function formatArgs(ast, environment) {
    return _.map(ast.args, function (arg) {
        return formatArg(arg, environment);
    });
}

function formatInst(ast, environment) {
    var formattedInst = ast.inst;
    if (ast.args) {
        var formattedArgs = formatArgs(ast, environment).join(",");
        formattedInst += ' ' + formattedArgs;
    }
    return formattedInst;
}

function setForwardExpr(forwardExpr, bytes) {
    _.each(bytes, function (b) {
        if (b.type && b.expr === '$nn') {
            b.expr = forwardExpr;
        }
    });
}

function parse(ast, environment) {
    var formattedInst = formatInst(ast, environment);
    var bytes = z80parser.parse(formattedInst);
    if (forwardExpr) {
        setForwardExpr(forwardExpr, bytes);
    }
    return bytes;
}

module.exports.parse = parse;
