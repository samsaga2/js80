'use strict';

var parser = require('./parser'),
    util = require('util'),
    _ = require('underscore'),
    fs = require('fs'),
    Image = require('./image'),
    miscutil = require('./miscutil'),
    path = require('path'),
    evalExpr = require('./expr').evalExpr,
    Environment = require('./environment'),
    parseInst = require('./parseasminst'),
    Errors = require('./errors'),
    insts = require('./insts');

function JS80() {
    this.image = new Image();
    this.secondPassTasks = [];

    this.macros = {};
    this.searchPath = ['.', path.resolve(__dirname, '../msx')];

    var globalEnv = {
        __map__: 0
    };
    var localEnv = {
        __lineIndex__: 1,
        __filename__: '',
        __macro__: '',
        __label__: '',
        __module__: ''
    };
    this.env = new Environment(globalEnv, localEnv);

    this.errors = new Errors();
}

JS80.prototype.executeMacro = function (id, args) {
    var macro = this.macros[id];

    var argValues = _.chain(macro.args)
        .map(function (macroArg) {
            if (macroArg.rest) {
                return ['__arguments__', args];
            }
            if (args.length === 0 && !('default' in macroArg)) {
                this.errors.add('Missing arguments', this.env);
            }
            var arg = args.shift();
            if(arg === undefined) {
                arg = macroArg.default;
            }
            return [macroArg.id, arg];
        }, this)
        .object()
        .value();

    this.env.push();
    this.env.set('__macro__', id);
    _.each(argValues, function (finalArg, argName) {
        this.env.set(argName, finalArg);
    }, this)
    this.compileAST(macro.body);
    this.env.pop();
};

JS80.prototype.compileAST = function (ast) {
    _.each(_.flatten(ast), function(astInst) {
        insts.write(this, astInst);
    }, this);
};

JS80.prototype.defineLabel = function (name, value) {
    var currentStruct = this.env.get('__struct__');
    if(currentStruct) {
        if (name.indexOf('.') >= 0) {
            this.errors.add('Invalid label name', this.env);
            return;
        }
        name = currentStruct + '.' + name;
    } else {
        if (name[0] === '.') {
            if (name.indexOf('.') > 0) {
                this.errors.add('Invalid label name', this.env);
                return;
            }
	    var label = this.env.get('__label__');
	    if(label.length == 0) {
                this.errors.add('Missing parent label', this.env);
                return;
	    }
            name = label + name;
        } else {
            this.env.set('__label__', name);
        }

	var module = this.env.get('__module__');
        if (module.length > 0) {
            name = module + '.' + name;
        }
    }
    if (this.env.has(name)) {
        this.errors.add('label ' + name + ' duplicated', this.env);
        return;
    }

    this.env.setGlobal(name, value);
};

JS80.prototype.writeBytes = function (bytes) {
    bytes = _.map(bytes, function (b, index) {
        if (_.isObject(b)) {
            b = _.clone(b);
            b.currentPage = this.image.currentPage;
            b.offset = this.image.currentPage.output.length + index;
            b.next = this.image.currentPage.origin + this.image.currentPage.output.length + bytes.length;
            b.env = this.env.clone();
            this.secondPassTasks.push(b);
            return 0;
        } else {
            return b;
        }
    }, this);
    this.image.write(bytes);
};

JS80.prototype.secondPassByteStep = function (pass, value) {
    if (value < -127 || value > 255) {
        this.errors.add('Value overflow', pass.env);
	value = 0;
    }
    pass.currentPage.setByte(pass.offset, value);
};

JS80.prototype.secondPassWordStep = function (pass, value) {
    if (value < -32767 || value > 65535) {
        this.errors.add('Value overflow', pass.env);
	value = 0;
    }
    pass.currentPage.setWord(pass.offset, value);
};

JS80.prototype.secondPassRelativeStep = function (pass, value) {
    var rel = value - pass.next;
    if (rel < -128 || rel > 127) {
        this.errors.add('Value overflow', pass.env);
	rel = 0;
    }
    pass.currentPage.setByte(pass.offset, rel);
};

JS80.prototype.secondPassStep = function (pass) {
    try {
        for(var addr = pass.expr, i=100; !_.isNumber(addr), i>0; addr = evalExpr(addr, pass.env), i--);
        if(i === 0 && !_.isNumber(addr)) {
            this.errors.add("Loop evaluating expr", pass.env);
            addr = 0;
        }
    } catch (e) {
        this.errors.add(e.message, pass.env);
        addr = 0;
    }
    if (!_.isNumber(addr)) {
        this.errors.add('Missing label ' + addr, pass.env);
        return;
    }

    switch (pass.type) {
        case 'byte':
	    this.secondPassByteStep(pass, addr);
            break;
        case 'word':
	    this.secondPassWordStep(pass, addr);
            break;
        case 'relative':
	    this.secondPassRelativeStep(pass, addr);
            break;
        default:
            throw new Error('Internal error');
    }
};

JS80.prototype.secondPass = function () {
    _.each(this.secondPassTasks, this.secondPassStep, this);
    this.secondPassTasks = [];
};

JS80.prototype.compileFile = function (fileName) {
    this.env.push();
    this.env.set('__filename__', fileName);
    var code = fs.readFileSync(fileName);
    this.asm(code.toString());
    this.env.pop();
};

JS80.prototype.asm = function (code) {
    try {
        var ast = parser.parse(code);
    } catch (e) {
        this.env.push();
        this.env.set('__lineIndex__', e.line);
        this.errors.add('Syntax error', this.env);
        this.env.pop();
    }
    this.compileAST(ast);
};

JS80.prototype.buildImage = function () {
    if (this.errors.hasErrors()) {
        throw new Error('Code has errors');
    }
    return this.image.build();
}

JS80.prototype.saveImage = function (fileName) {
    var image = this.buildImage();
    var buffer = new Buffer(image.length);
    for (var i = 0; i < image.length; i++) {
        buffer[i] = image[i];
    }
    fs.writeFileSync(fileName, buffer, 'binary');
};

JS80.prototype.saveSymbols = function (fileName) {
    if (this.errors.hasErrors()) {
        throw new Error('Code has errors');
    }
    fs.truncateSync(fileName, 0);
    _.each(this.env.labels(), function (equ, label) {
        fs.appendFileSync(fileName, util.format("%s: equ 0%sh\n", label, equ.toString(16)));
    });
};

module.exports = JS80;
