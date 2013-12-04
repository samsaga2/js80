'use strict';

var _ = require('underscore');

function Environment(globalEnv, localEnv) {
    this.env = [globalEnv||{}, localEnv||{}];
}

Environment.prototype.push = function() {
    this.env.push({});
};

Environment.prototype.pop = function() {
    this.env.pop();
    if(this.env.length == 1) {
        throw new Error('Too many environment pops');
    }
};

Environment.prototype.defineLocal = function(name, value) {
    this.env[this.env.length - 1][name] = value;
};

Environment.prototype.defineLabel = function(name, value) {
    this.env[0][name] = value;
};

Environment.prototype.get = function(name) {
    for(var i = this.env.length - 1; i >= 0; i--) {
        if(name in this.env[i]) {
            return this.env[i][name];
        }
    }
    return undefined;
};

Environment.prototype.has = function(name) {
    return this.get(name) !== undefined;
};

Environment.prototype.clone = function() {
    var cloned = new Environment();
    cloned.env = _.map(this.env, _.clone);
    cloned.env[0] = this.env[0]; // global is really global
    return cloned;
};

Environment.prototype.labels = function() {
    return _.clone(this.env[0]);
};

Environment.prototype.inferenceLabel = function(label) {
    if(label[0] === '.') {
        label = this.get('__label__') + label;
        if(label[0] === '.') {
            throw new Error('Missing label');
        }
    }
    if(this.has(label)) {
        return label;
    }
    if(this.get('__module__') && label.split('.').length < 2) {
        label = this.get('__module__') + '.' + label;
    }
    return label;
};

module.exports = Environment;