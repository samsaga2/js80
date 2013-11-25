'use strict';

var _ = require('underscore');

function reduce(l, func) {
    return _.reduce(_.rest(l), function(memo, num) {
        return func(memo, num);
    }, _.first(l));
}

function toBool(r) {
    return r ? 1 : 0;
}

function evalExpr(expr, env) {
    if(_.isNumber(expr)) {
        return expr;
    }

    var commands = {
        id: function() {
            if(env.has(expr.id)) {
                return env.get(expr.id);
            }
            var l = env.inferenceLabel(expr.id);
            if(env.has(l)) {
                return env.get(l);
            }
            throw new Error('Unknown label ' + expr.id);
            return expr.id;
        },
        neg: function() {
            return -evalExpr(expr.neg, env);
        },
        paren: function() {
            return evalExpr(expr.paren, env);
        },
        binary: function() {
            var values = _.map(expr.args, function(e) {
                return evalExpr(e, env);
            });
            var ops = {
                '+': function(l, r) {
                    return l + r;
                },
                '-': function(l, r) {
                    return l - r;
                },
                '*': function(l, r) {
                    return l * r;
                },
                '/': function(l, r) {
                    return l / r;
                },
                '<<': function(l, r) {
                    return l << r;
                },
                '>>': function(l, r) {
                    return l >> r;
                },
                '^': function(l, r) {
                    return l ^ r;
                },
                '|': function(l, r) {
                    return l | r;
                },
                '&': function(l, r) {
                    return l & r;
                },
                '=': function(l, r) {
                    return toBool(l === r);
                },
                '!=': function(l, r) {
                    return toBool(l !== r);
                },
                '<': function(l, r) {
                    return toBool(l < r);
                },
                '>': function(l, r) {
                    return toBool(l > r);
                },
                '<=': function(l, r) {
                    return toBool(l <= r);
                },
                '>=': function(l, r) {
                    return toBool(l >= r);
                }
            };
            return reduce(values, ops[expr.binary]);
        },
        str: function() {
            return expr.str;
        },
        chr: function() {
            return expr.chr[0].charCodeAt(0);
        },
        arg: function() {
            var args = env.get('__arguments__');
            var argIndex = evalExpr(expr.arg, env);
            if(argIndex === 0) {
                return args.length;
            }
            return args[argIndex - 1];
        },
        map: function() {
            var mapLength = evalExpr(expr.map, env);
            var addr = env.get('__map__');
            env.defineLabel('__map__', addr + mapLength, true);
            return addr;
        },
        eq: function() {
            return toBool(evalExpr(expr.eq.left, env) === evalExpr(expr.eq.right, env));
        },
        neq: function() {
            return toBool(evalExpr(expr.neq.left, env) !== evalExpr(expr.neq.right, env));
        },
        lt: function() {
            return toBool(evalExpr(expr.lt.left, env) < evalExpr(expr.lt.right, env));
        },
        gt: function() {
            return toBool(evalExpr(expr.gt.left, env) > evalExpr(expr.gt.right, env));
        },
        le: function() {
            return toBool(evalExpr(expr.le.left, env) <= evalExpr(expr.le.right, env));
        },
        ge: function() {
            return toBool(evalExpr(expr.ge.left, env) >= evalExpr(expr.ge.right, env));
        }
    };

    for(var key in commands) {
        if(key in expr) {
            return commands[key]();
        }
    }

    throw new Error('Internal error');
}

module.exports = {
    evalExpr: evalExpr
};