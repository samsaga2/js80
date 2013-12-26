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
    this.environment = new Environment(globalEnv, localEnv);

    this.errors = new Errors();
}

JS80.prototype.addError = function (msg, lineIndex, fileName) {
    var macro = this.environment.get('__macro__');
    fileName = fileName || this.environment.get('__filename__');
    lineIndex = lineIndex || this.environment.get('__lineIndex__');
    this.errors.add(msg, macro, lineIndex, fileName);
};

JS80.prototype.executeMacro = function (id, args) {
    var macro = this.macros[id];

    var argValues = _.chain(macro.args)
        .map(function (macroArg) {
            if (macroArg.rest) {
                return ['__arguments__', args];
            }
            if (args.length === 0 && !('default' in macroArg)) {
                this.addError('Missing arguments');
            }
            var arg = args.shift();
            if(arg === undefined) {
                arg = macroArg.default;
            }
            return [macroArg.id, arg];
        }, this)
        .object()
        .value();

    this.environment.push();
    _.each(argValues, function (finalArg, argName) {
        this.environment.defineLocal(argName, finalArg);
    }, this)
    this.writeInsts(macro.body);
    this.environment.pop();
};

JS80.prototype.writeInsts = function (ast) {
    _.each(_.flatten(ast), function(astInst) {
        insts.write(this, astInst);
    }, this);
};

JS80.prototype.defineLabel = function (name, value) {
    var currentStruct = this.environment.get('__struct__');
    if(currentStruct) {
        name = currentStruct + '.' + name;
    } else {
        if (name[0] === '.') {
            if (name.indexOf('.') > 0) {
                this.addError('Invalid label name');
                return;
            }
            name = this.environment.get('__label__') + name;
        } else {
            this.environment.defineLocal('__label__', name);
        }
        if (this.environment.get('__module__').length > 0) {
            name = this.environment.get('__module__') + '.' + name;
        }
    }
    if (this.environment.has(name)) {
        this.addError('Label ' + name + ' already exists');
        return;
    }

    var labelValue = value || (this.image.currentPage.origin + this.image.currentPage.offset);
    this.environment.defineLabel(name, labelValue);
};

JS80.prototype.writeBytes = function (bytes) {
    bytes = _.map(bytes, function (b, index) {
        if (_.isObject(b)) {
            b = _.clone(b);
            b.currentPage = this.image.currentPage;
            b.offset = this.image.currentPage.offset + index;
            b.next = this.image.currentPage.origin + this.image.currentPage.offset + bytes.length;
            b.environment = this.environment.clone();
            this.secondPassTasks.push(b);
            return 0;
        } else {
            return b;
        }
    }, this);
    this.image.write(bytes);
};

JS80.prototype.secondPassStep = function (pass) {
    try {
        for(var addr = pass.expr, i=100; !_.isNumber(addr), i>0; addr = evalExpr(addr, pass.environment), i--);
        if(i === 0 && !_.isNumber(addr)) {
            this.addError("Loop evaluating expr", pass.environment.get('__lineIndex__'), pass.environment.get('__filename__'));
            addr = 0;
        }
    } catch (e) {
        this.addError(e.message, pass.environment.get('__lineIndex__'), pass.environment.get('__filename__'));
        addr = 0;
    }
    if (!_.isNumber(addr)) {
        this.addError('Unknown label `' + addr + "'");
        return;
    }
    switch (pass.type) {
        case 'byte':
            if (addr < -127 || addr > 255) {
                this.addError('Value overflow');
            } else {
                pass.currentPage.output[pass.offset] = miscutil.compl2(addr & 255);
            }
            break;
        case 'word':
            if (addr < -32767 || addr > 65535) {
                this.addError('Value overflow');
            } else {
                pass.currentPage.output[pass.offset] = miscutil.compl2(addr & 255);
                pass.currentPage.output[pass.offset + 1] = miscutil.compl2((addr >> 8) & 255);
            }
            break;
        case 'relative':
            var rel = addr - pass.next;
            if (rel < -128 || rel > 127) {
                this.addError('Value overflow');
            } else {
                pass.currentPage.output[pass.offset] = miscutil.compl2(rel);
            }
            break;
        default:
            this.addError('Internal error');
    }
};

JS80.prototype.secondPass = function () {
    _.each(this.secondPassTasks, this.secondPassStep, this);
    this.secondPassTasks = [];
};

JS80.prototype.compileFile = function (fileName) {
    this.environment.push();
    this.environment.defineLocal('__filename__', fileName);
    var code = fs.readFileSync(fileName);
    this.asm(code.toString());
    this.environment.pop();
};

JS80.prototype.asm = function (code) {
    try {
        var ast = parser.parse(code);
    } catch (e) {
        this.addError('Syntax error', e.line);
    }
    this.writeInsts(ast);
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
    _.each(this.environment.labels(), function (equ, label) {
        fs.appendFileSync(fileName, util.format("%s: equ 0%sh\n", label, equ.toString(16)));
    });
};

module.exports = JS80;
