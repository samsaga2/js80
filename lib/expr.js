'use strict';

var _ = require('underscore');

function reduce(l, func) {
    return _.reduce(_.rest(l), function(memo, num) {
        return func(memo, num);
    }, _.first(l));
}

function inferenceLabel(label, labels, environment) {
    if(label[0] === '.') {
        label = environment.__label__ + label;
    }
    if(label in labels) {
        return label;
    }
    if(environment.__module__ && label.split('.').length < 2) {
        label = environment.__module__ + '.' + label;
    }
    return label;
}

function evalExpr(expr, labels, environment) {
    function _eval(expr) {
        if(expr.id) {
            var l = inferenceLabel(expr.id, labels, environment);
            if(l in labels) {
                return labels[l];
            }
        }
        if(expr.id) {
            return expr.id;
        }
        if('num' in expr) {
            return expr.num;
        }
        if(expr.neg) {
            return -_eval(expr.neg);
        }
        if(expr.paren) {
            return _eval(expr.paren);
        }
        if(expr.unary) {
            var values = _.map(expr.args, _eval);
            switch(expr.unary) {
                case '+':
                    return reduce(values, function(l, r) {
                        return l + r;
                    });
                case '-':
                    return reduce(values, function(l, r) {
                        return l - r;
                    });
                case '*':
                    return reduce(values, function(l, r) {
                        return l * r;
                    });
                case '/':
                    return reduce(values, function(l, r) {
                        return l / r;
                    });
                case '<<':
                    return reduce(values, function(l, r) {
                        return l << r;
                    });
                case '>>':
                    return reduce(values, function(l, r) {
                        return l >> r;
                    });
                case '^':
                    return reduce(values, function(l, r) {
                        return l ^ r;
                    });
                case '|':
                    return reduce(values, function(l, r) {
                        return l | r;
                    });
                case '&':
                    return reduce(values, function(l, r) {
                        return l & r;
                    });
            }
        }
        if(expr.str) {
            return expr.str;
        }
        if(expr.chr) {
            return expr.chr[0].charCodeAt(0);
        }
        if('arg' in expr) {
            var args = labels.__arguments__;
            var argIndex = _eval(expr.arg);
            if(argIndex === 0) {
                return args.length;
            }
            return args[argIndex - 1];
        }
        if('map' in expr) {
            var mapLength = _eval(expr.map);
            var addr = labels.__map__;
            labels.__map__ += mapLength;
            return addr;
        }
        if('eq' in expr) {
            var eqleft = _eval(expr.eq.left);
            var eqright = _eval(expr.eq.right);
            return eqleft === eqright ? 1 : 0;
        }
        if('neq' in expr) {
            var neqleft = _eval(expr.neq.left);
            var neqright = _eval(expr.neq.right);
            return neqleft !== neqright ? 1 : 0;
        }
        if('lt' in expr) {
            var ltleft = _eval(expr.lt.left);
            var ltright = _eval(expr.lt.right);
            return ltleft < ltright ? 1 : 0;
        }
        if('gt' in expr) {
            var gtleft = _eval(expr.gt.left);
            var gtright = _eval(expr.gt.right);
            return gtleft > gtright ? 1 : 0;
        }
        if('le' in expr) {
            var leleft = _eval(expr.le.left);
            var leright = _eval(expr.le.right);
            return leleft <= leright ? 1 : 0;
        }
        if('ge' in expr) {
            var geleft = _eval(expr.ge.left);
            var geright = _eval(expr.ge.right);
            return geleft >= geright ? 1 : 0;
        }

        throw new Error('Internal error');
    }

    return _eval(expr);
}

module.exports = {
    inferenceLabel: inferenceLabel,
    evalExpr: evalExpr
};