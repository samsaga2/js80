'use strict';

var util = require('util'),
    evalExpr = require('./expr').evalExpr,
    z80parser = require('./z80parser'),
    _ = require('underscore');

var forwardExpr;

function formatArg(arg, environment) {
    // strings are not valid as arguments
    if(arg.str) {
        throw new Error('Invalid argument');
    }

    // format paren expressions
    if(arg.paren) {
        var p = arg.paren;
        if(_.isNumber(p)) {
            return util.format('(%d)', p);
        } else if(p.id) {
            return util.format('(%s)', p.id);
        } else if(p.unary === '+' && ['ix', 'iy'].indexOf(p.args[0].id.toString().toLowerCase()) > -1) {
            var reg = p.args[0].id.toString().toLowerCase();
            var offset = evalExpr({unary: p.unary, args: _.rest(p.args)}, environment);
            if(offset < 0) {
                return util.format('(%s%d)', reg, offset);
            } else {
                return util.format('(%s+%d)', reg, offset);
            }
        } else {
            return formatArg(arg.paren, environment);
        }
    }

    // if expr evalutes to a number use it
    var value = evalExpr(arg, environment);
    if(_.isNumber(value)) {
        return value.toString();
    }

    if(arg.id) {
        return arg.id; // because it can be a register (or a variable) save it for later
    }

    forwardExpr = arg;
    return '$nn';
}

function formatArgs(ast, environment) {
    var formatedArgs = _.map(ast.args, function(arg) {
        return formatArg(arg, environment);
    });
    return formatedArgs.join(',');
}

function formatInst(ast, environment) {
    var formatedInst = ast.inst;
    if(ast.args) {
        formatedInst += formatArgs(ast, environment);
    }
    return formatedInst;
}

function setForwardExpr(forwardExpr, bytes) {
    _.each(bytes, function(b) {
        if(b.type && b.expr === '$nn') {
            b.expr = forwardExpr;
        }
    });
}

function parse(ast, environment) {
    var formatedInst = formatInst(ast, environment);
    var bytes = z80parser.parse(formatedInst);
    if(forwardExpr) {
        setForwardExpr(forwardExpr, bytes);
    }
    return bytes;
}

module.exports.parse = parse;
