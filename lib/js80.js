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
    Errors = require('./errors');

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

JS80.prototype.writeAsmInst = function (ast) {
    try {
        var bytes = parseInst.parse(ast, this.environment);
        this.writeBytes(bytes);
    } catch (e) {
        this.addError('Syntax error');
    }
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
            var arg = args.shift() || macroArg.default;
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

JS80.prototype.writeInsts = function (insts) {
    _.each(_.flatten(insts), this.writeInst, this);
};

var commands = {};

commands.label = function (label, js80) {
    js80.defineLabel(label);
};
commands.body = function (body, js80) {
    js80.writeInsts(body);
};
commands.asm = function (asm, js80) {
    if (asm.execmacro && asm.inst in js80.macros) {
        js80.environment.push();
        js80.environment.defineLocal('__macro__', asm.inst);
        js80.executeMacro(asm.inst, asm.args || []);
        js80.environment.pop();
    } else {
        js80.writeAsmInst(asm);
    }
};
commands.org = function (org, js80) {
    js80.image.currentPage.origin = evalExpr(org, js80.environment);
};
commands.map = function (map, js80) {
    js80.environment.defineLabel('__map__', evalExpr(map, js80.environment));
};
commands.ds = function (ds, js80) {
    var len = evalExpr(ds.len, js80.environment);
    var value = evalExpr(ds.value, js80.environment);
    js80.writeBytes(miscutil.fill(len, value));
};
commands.dw = function (dw, js80) {
    _.flatten(_.map(dw, function (i) {
        js80.writeBytes([
            {type: 'word', expr: i},
            0
        ]);
    }));
};
commands.db = function (db, js80) {
    _.flatten(_.map(db, function (i) {
        var r = evalExpr(i, js80.environment);
        if (_.isString(r)) {
            _.each(r, function (i) {
                js80.writeBytes([i.charCodeAt(0)]);
            }, js80);
        } else {
            js80.writeBytes([
                {type: 'byte', expr: r}
            ]);
        }
    }));
};
commands.equ = function (equ, js80) {
    js80.defineLabel(equ.label, evalExpr(equ.value, js80.environment));
};
commands.module = function (module, js80) {
    js80.environment.defineLocal('__module__', module);
};
commands.endmodule = function (endmodule, js80) {
    js80.environment.defineLocal('__module__', '');
};
commands.include = function (include, js80) {
    var done = false;
    _.each(js80.searchPath, function (i) {
        var fullname = path.join(i, include);
        if (fs.existsSync(fullname)) {
            js80.compileFile(fullname);
            done = true;
        }
        return !done;
    }, this);
    if (!done) {
        js80.addError('File not found `' + include + "'");
    }
};
commands.incbin = function (incbin, js80) {
    var data = fs.readFileSync(incbin.file);
    var skip = incbin.skip ? evalExpr(incbin.skip, js80.environment) : 0;
    var len = incbin.len ? evalExpr(incbin.len, js80.environment) : data.length;
    js80.writeBytes(Array.prototype.slice.call(data, skip, skip + len));
};
commands.macro = function (macro, js80) {
    js80.macros[macro.id] = macro;
};
commands.repeat = function (repeat, js80) {
    var n = evalExpr(repeat.count, js80.environment);
    _.each(_.range(n), function () {
        js80.writeInsts(repeat.body);
    });
};
commands.rotate = function (rotate, js80) {
    var n = evalExpr(rotate, js80.environment);
    var args = js80.environment.get('__arguments__').rotate(n);
    js80.environment.defineLocal('__arguments__', args);
};
commands.defpage = function (defpage, js80) {
    var pages;
    if (_.isNumber(defpage.index)) {
        pages = [defpage.index];
    } else if ('start' in defpage.index) {
        var start = evalExpr(defpage.index.start, js80.environment);
        var end = evalExpr(defpage.index.end, js80.environment);
        pages = _.range(start, end + 1);
    }
    _.each(pages, function (index) {
        js80.image.pages[index].origin = evalExpr(defpage.origin, js80.environment);
        js80.image.pages[index].size = evalExpr(defpage.size, js80.environment);
    });
};
commands.page = function (page, js80) {
    if (_.isNumber(page)) {
        js80.image.selectPage([evalExpr(page, js80.environment)]);
    } else {
        var start = evalExpr(page.start, js80.environment);
        var end = evalExpr(page.end, js80.environment);
        js80.image.selectPage(_.range(start, end + 1));
    }
};
commands.echo = function (echo, js80) {
    console.log(_.map(echo,function (arg) {
        return evalExpr(arg, js80.environment).toString();
    }).join(' '));
};
commands.error = function (error, js80) {
    var msg = evalExpr(error, js80.environment);
    js80.addError(msg);
};
commands.if = function (iff, js80) {
    var cond;
    if ('defined' in iff) {
        var deflabel = js80.environment.inferenceLabel(iff.defined);
        cond = js80.environment.has(deflabel);
    } else if ('undefined' in iff) {
        var undeflabel = js80.environment.inferenceLabel(iff.undefined);
        cond = !js80.environment.has(undeflabel);
    } else if ('expr' in iff) {
        cond = evalExpr(iff.expr, js80.environment);
    } else {
        js80.addError('Internal error');
        return;
    }
    if (cond) {
        js80.writeInsts(iff.thenBody);
    } else if (iff.elseBody !== null) {
        js80.writeInsts(iff.elseBody);
    }
};

JS80.prototype.writeInst = function (code) {
    if (_.isEmpty(code)) {
        return;
    }

    this.environment.defineLabel('$', this.image.here());
    if (code.line) {
        this.environment.defineLocal('__lineIndex__', code.line);
    }

    var done = false;
    _.each(commands, function (fn, key) {
        if (key in code) {
            done = true;
            try {
                fn(code[key], this);
            } catch (e) {
                this.addError(e.message);
            }
        }
    }, this);
    if (!done) {
        this.addError('Internal error');
    }
};

JS80.prototype.defineLabel = function (name, value) {
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
        var addr = evalExpr(pass.expr, this.environment);
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
