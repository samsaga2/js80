'use strict';

var parser = require('./parser'),
    z80parser = require('./z80parser'),
    util = require('util'),
    _ = require('underscore'),
    fs = require('fs'),
    Image = require('./image'),
    miscutil = require('./miscutil'),
    path = require('path'),
    evalExpr = require('./expr').evalExpr,
    Environment = require('./environment');

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
        __label__: '',
        __module__: ''
    };
    this.environment = new Environment(globalEnv, localEnv);

    this.errors = [];
}

JS80.prototype.addError = function(msg, env) {
    this.errors.push({msg: msg, environment: (env || this.environment).clone()});
};

JS80.prototype.buildTemplateArg = function(arg) {
    if(arg.paren) {
        var p = arg.paren;
        if(_.isNumber(p)) {
            return util.format('(%d)', p);
        } else if('id' in p) {
            return util.format('(%s)', p.id);
        } else if(p.unary === '+' && ['ix', 'iy'].indexOf(p.args[0].id.toString().toLowerCase()) > -1) {
            var reg = p.args[0].id.toString().toLowerCase();
            var offset = evalExpr({unary: p.unary, args: _.rest(p.args)}, this.environment);
            if(offset < 0) {
                return util.format('(%s%d)', reg, offset);
            } else {
                return util.format('(%s+%d)', reg, offset);
            }
        } else {
            return this.buildTemplateArg(arg.paren);
        }
    } else if(arg.str) {
        this.addError('Invalid argument');
        return 0;
    }
    return evalExpr(arg, this.environment).toString();
};

JS80.prototype.parseAsmInst = function(ast) {
    var template;
    if(ast.args) {
        var templateArgs = _.map(ast.args, this.buildTemplateArg, this);
        template = ast.inst + ' ' + templateArgs.join(',');
    } else {
        template = ast.inst;
    }

    try {
        var bytes = z80parser.parse(template);
        this.writeBytes(bytes);
    } catch(e) {
        this.addError('Syntax error ' + template);
    }
};

JS80.prototype.executeMacro = function(id, args) {
    this.environment.push();
    var macro = this.macros[id];

    // eval args
    _.each(macro.args, function(macroArg) {
        if(macroArg.rest) {
            var rest = [];
            while(args.length) {
                rest.push(evalExpr(args.shift(), this.environment));
            }
            this.environment.defineLocal('__arguments__', rest);
        } else {
            var evaluatedArg = evalExpr(args.shift() || macroArg.default || 0, this.environment);
            this.environment.defineLocal(macroArg.id, evaluatedArg);
        }
    }, this);

    // run macro
    this.parseInsts(macro.body);
    this.environment.pop();
};

JS80.prototype.parseInsts = function(insts) {
    _.each(_.flatten(insts), this.parseInst, this);
};

JS80.prototype.parseInst = function(code) {
    if(_.isEmpty(code)) {
        return;
    }

    var self = this;
    var commands = {
        label: function(label) {
            self.defineLabel(label);
        },
        asm: function(asm) {
            if(asm.execmacro && asm.inst in self.macros) {
                self.executeMacro(asm.inst, asm.args || []);
            } else {
                self.parseAsmInst(asm);
            }
        },
        org: function(org) {
            self.image.currentPage.origin = evalExpr(org, self.environment);
        },
        map: function(map) {
            self.environment.defineLabel('__map__', evalExpr(map, self.environment));
        },
        ds: function(ds) {
            var len = evalExpr(ds.len, self.environment);
            var value = evalExpr(ds.value, self.environment);
            self.writeBytes(miscutil.fill(len, value));
        },
        dw: function(dw) {
            _.flatten(_.map(dw, function(i) {
                self.writeBytes([
                    {type: 'word', expr: i},
                    0
                ]);
            }));
        },
        db: function(db) {
            _.flatten(_.map(db, function(i) {
                var r = evalExpr(i, self.environment);
                if(_.isString(r)) {
                    _.each(r, function(i) {
                        self.writeBytes([i.charCodeAt(0)]);
                    }, self);
                } else {
                    self.writeBytes([
                        {type: 'byte', expr: r}
                    ]);
                }
            }));
        },
        equ: function(equ) {
            self.defineLabel(equ.label, evalExpr(equ.value, self.environment));
        },
        module: function(module) {
            self.environment.defineLocal('__module__', module);
        },
        endmodule: function() {
            self.environment.defineLocal('__module__', '');
        },
        include: function(include) {
            var done = false;
            _.each(self.searchPath, function(i) {
                var fullname = path.join(i, include);
                if(fs.existsSync(fullname)) {
                    self.compileFile(fullname);
                    done = true;
                }
                return !done;
            }, this);
            if(!done) {
                self.addError('File not found');
            }
        },
        incbin: function(incbin) {
            var data = fs.readFileSync(incbin.file);
            var skip = incbin.skip ? evalExpr(incbin.skip, self.environment) : 0;
            var len = incbin.len ? evalExpr(incbin.len, self.environment) : data.length;
            self.writeBytes(Array.prototype.slice.call(data, skip, skip + len));
        },
        macro: function(macro) {
            self.macros[macro.id] = macro;
        },
        repeat: function(repeat) {
            var n = evalExpr(repeat.count, self.environment);
            _.each(_.range(n), function() {
                self.parseInsts(repeat.body);
            });
        },
        rotate: function(rotate) {
            var n = evalExpr(rotate, self.environment);
            var args = self.environment.get('__arguments__').rotate(n);
            self.environment.defineLocal('__arguments__', args);
        },
        defpage: function(defpage) {
            var pages;
            if(_.isNumber(defpage.index)) {
                pages = [defpage.index];
            } else if('start' in defpage.index) {
                var start = evalExpr(defpage.index.start, self.environment);
                var end = evalExpr(defpage.index.end, self.environment);
                pages = _.range(start, end + 1);
            }
            _.each(pages, function(index) {
                self.image.pages[index].origin = evalExpr(defpage.origin, self.environment);
                self.image.pages[index].size = evalExpr(defpage.size, self.environment);
            });
        },
        page: function(page) {
            if(_.isNumber(page)) {
                self.image.selectPage([evalExpr(page, self.environment)]);
            } else {
                var start = evalExpr(page.start, self.environment);
                var end = evalExpr(page.end, self.environment);
                self.image.selectPage(_.range(start, end + 1));
            }
        },
        echo: function(echo) {
            console.log(_.map(echo,function(arg) {
                return evalExpr(arg, self.environment).toString();
            }).join(' '));
        },
        error: function(error) {
            var msg = evalExpr(error, self.environment);
            self.addError(msg);
        },
        if: function(iff) {
            var cond;
            if('defined' in iff) {
                var deflabel = self.environment.inferenceLabel(iff.defined);
                cond = self.environment.has(deflabel);
            } else if('undefined' in iff) {
                var undeflabel = self.environment.inferenceLabel(iff.undefined);
                cond = !self.environment.has(undeflabel);
            } else if('expr' in iff) {
                cond = evalExpr(iff.expr, self.environment);
            } else {
                self.addError('Internal error');
                return;
            }
            if(cond) {
                self.parseInsts(iff.thenBody);
            } else if(iff.elseBody !== null) {
                self.parseInsts(iff.elseBody);
            }
        }
    };

    this.environment.defineLabel('$', this.image.here());
    if(code.line) {
        self.environment.defineLocal('__lineIndex__', code.line);
    }

    var done = false;
    _.each(commands, function(fn, key) {
        if(key in code) {
            fn(code[key]);
            done = true;
        }
    });
    if(!done) {
        this.addError('Internal error');
    }
};

JS80.prototype.defineLabel = function(name, value) {
    if(name[0] === '.') {
        if(name.indexOf('.') > 0) {
            this.addError('Invalid label name');
            return;
        }
        name = this                             .environment.get('__label__') + name;
    } else {
        this.environment.defineLocal('__label__', name);
    }
    if(this.environment.get('__module__').length > 0) {
        name = this.environment.get('__module__') + '.' + name;
    }
    if(this.environment.has(name)) {
        this.addError('Label ' + name + ' already exists');
        return;
    }

    var labelValue = value || (this.image.currentPage.origin + this.image.currentPage.offset);
    this.environment.defineLabel(name, labelValue);
};

JS80.prototype.writeBytes = function(bytes) {
    bytes = _.map(bytes, function(b, index) {
        if(_.isObject(b)) {
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

JS80.prototype.secondPassStep = function(pass) {
    try {
        var addr = evalExpr(pass.expr, pass.environment);
    } catch(e) {
        this.addError(e.message, pass.environment);
        addr = 0;
    }
    if(!_.isNumber(addr)) {
        this.addError('Unknown label `' + addr + "'");
        return;
    }
    switch(pass.type) {
        case 'byte':
            if(addr < -127 || addr > 255) {
                this.addError('Value overflow');
            } else {
                pass.currentPage.output[pass.offset] = miscutil.compl2(addr & 255);
            }
            break;
        case 'word':
            if(addr < -32767 || addr > 65535) {
                this.addError('Value overflow');
            } else {
                pass.currentPage.output[pass.offset] = miscutil.compl2(addr & 255);
                pass.currentPage.output[pass.offset + 1] = miscutil.compl2((addr >> 8) & 255);
            }
            break;
        case 'relative':
            var rel = addr - pass.next;
            if(rel < -128 || rel > 127) {
                this.addError('Value overflow');
            } else {
                pass.currentPage.output[pass.offset] = miscutil.compl2(rel);
            }
            break;
        default:
            this.addError('Internal error');
    }
};

JS80.prototype.secondPass = function() {
    _.each(this.secondPassTasks, this.secondPassStep, this);
    this.secondPassTasks = [];
};

JS80.prototype.compileFile = function(fname) {
    this.environment.push();
    this.environment.defineLocal('__filename__', fname);
    var code = fs.readFileSync(fname);
    this.asm(code.toString());
    this.environment.pop();
};

JS80.prototype.asm = function(code) {
    try {
        var ast = parser.parse(code);
    } catch(e) {
        this.addError('Syntax error');
    }
    this.parseInsts(ast);
};

JS80.prototype.buildImage = function() {
    if(!_.isEmpty(this.errors)) {
        throw new Error('Code has errors');
    }
    return this.image.build();
}

JS80.prototype.saveImage = function(fname) {
    var image = this.buildImage();
    var buffer = new Buffer(image.length);
    for(var i = 0; i < image.length; i++) {
        buffer[i] = image[i];
    }
    fs.writeFileSync(fname, buffer, 'binary');
};

JS80.prototype.saveSymbols = function(fname) {
    if(!_.isEmpty(this.errors)) {
        throw new Error('Code has errors');
    }
    fs.truncateSync(fname, 0);
    _.each(this.environment.labels(), function(equ, label) {
        fs.appendFileSync(fname, util.format("%s: equ 0%sh\n", label, equ.toString(16)));
    });
};

module.exports = JS80;
