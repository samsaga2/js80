'use strict';

var parser = require('./parser'),
    z80parser = require('./z80parser'),
    util = require('util'),
    _ = require('underscore'),
    fs = require('fs'),
    Image = require('./image'),
    miscutil = require('./miscutil'),
    path = require('path'),
    expr = require('./expr');

function JS80() {
    this.image = new Image();
    this.secondPassTasks = [];

    this.labels = {__map__: 0};
    this.macros = {};
    this.searchPath = ['.', path.resolve(__dirname, '../msx')];

    this.environment = {
        __filename__: '',
        __lineIndex__: 1,
        __label__: '',
        __module__: ''
    };

    this.errors = [];
}

JS80.prototype.addError = function(msg) {
    this.errors.push({msg: msg, environment: _.clone(this.environment)});
};

JS80.prototype.inferenceLabel = function(label, env) {
    return expr.inferenceLabel(label, this.labels, env || this.environment);
};

JS80.prototype.evalExpr = function(e) {
    return expr.evalExpr(e, this.labels, this.environment);
};

JS80.prototype.buildTemplateArg = function(arg) {
    if(arg.paren) {
        var p = arg.paren;
        if('id' in p) {
            return util.format('(%s)', p.id);
        } else if('num' in p) {
            return util.format('(%d)', p.num);
        } else if(p.unary === '+' && ['ix', 'iy'].indexOf(p.args[0].id.toString().toLowerCase()) > -1) {
            var reg = p.args[0].id.toString().toLowerCase();
            var offset = this.evalExpr({unary: p.unary, args: _.rest(p.args)});
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
    return this.evalExpr(arg).toString();
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

JS80.prototype.writeBytes = function(bytes) {
    bytes = _.map(bytes, function(b, index) {
        if(_.isObject(b)) {
            b = _.clone(b);
            b.page = this.image.page;
            b.offset = this.image.page.offset + index;
            b.next = this.image.page.origin + this.image.page.offset + bytes.length;
            b.info = _.clone(this.environment);
            this.secondPassTasks.push(b);
            return 0;
        } else {
            return b;
        }
    }, this);
    this.image.write(bytes);
};

JS80.prototype.executeMacro = function(id, args) {
    var macro = this.macros[id];

    // eval args
    var evalArgs = {};
    _.each(macro.args, function(macroArg) {
        if(macroArg.rest) {
            this.labels.__arguments__ = [];
            while(args.length) {
                this.labels.__arguments__.push(this.evalExpr(args.shift()));
            }
        } else {
            evalArgs[macroArg.id] = this.evalExpr(args.shift() || macroArg.default || {num: 0});
        }
    }, this);

    // run macro
    var labels = this.labels;
    this.labels = _.extend(_.clone(this.labels), evalArgs);
    this.parseInsts(macro.body);
    this.labels = labels;
};

JS80.prototype.parseInsts = function(insts) {
    _.each(_.flatten(insts), this.parseInst, this);
};

JS80.prototype.parseInst = function(code) {
    if(_.isEmpty(code)) {
        return;
    }

    this.labels.$ = this.image.here();

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
            self.image.page.origin = self.evalExpr(org);
        },
        map: function(map) {
            self.labels.__map__ = self.evalExpr(map);
        },
        ds: function(ds) {
            var len = self.evalExpr(ds.len);
            var value = self.evalExpr(ds.value);
            self.writeBytes(miscutil.fill(len, value));
        },
        dw: function(dw) {
            _.flatten(_.map(dw, function(i) {
                self.writeBytes([
                    {type: 'word', expr: i},
                    0
                ]);
            }, self));
        },
        db: function(db) {
            _.flatten(_.map(db, function(i) {
                var r = self.evalExpr(i);
                if(_.isString(r)) {
                    _.each(r, function(i) {
                        self.writeBytes([i.charCodeAt(0)]);
                    }, self);
                } else {
                    self.writeBytes([r]);
                }
            }, self));
        },
        equ: function(equ) {
            self.defineLabel(equ.label, self.evalExpr(equ.value));
        },
        module: function(module) {
            self.environment.__module__ = module;
        },
        endmodule: function() {
            self.environment.__module__ = '';
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
                this.addError('File not found');
            }
        },
        incbin: function(incbin) {
            var data = fs.readFileSync(incbin.file);
            var skip = incbin.skip ? self.evalExpr(incbin.skip) : 0;
            var len = incbin.len ? self.evalExpr(incbin.len) : data.length;
            self.writeBytes(Array.prototype.slice.call(data, skip, skip + len));
        },
        macro: function(macro) {
            self.macros[macro.id] = macro;
        },
        repeat: function(repeat) {
            var n = self.evalExpr(repeat.count);
            _.each(_.range(n), function() {
                self.parseInsts(repeat.body);
            }, self);
        },
        rotate: function(rotate) {
            var n = self.evalExpr(rotate);
            self.labels.__arguments__ = self.labels.__arguments__.rotate(n);
        },
        defpage: function(defpage) {
            var pages;
            if('start' in defpage.index) {
                var start = self.evalExpr(defpage.index.start);
                var end = self.evalExpr(defpage.index.end);
                pages = _.range(start, end + 1);
            } else {
                pages = [self.evalExpr(defpage.index)];
            }
            _.each(pages, function(index) {
                self.image.pages[index].origin = self.evalExpr(defpage.origin);
                self.image.pages[index].size = self.evalExpr(defpage.size);
            });
        },
        page: function(page) {
            if('start' in page) {
                var start = self.evalExpr(page.start);
                var end = self.evalExpr(page.end);
                self.image.selectPage(_.range(start, end + 1));
            } else {
                self.image.selectPage([self.evalExpr(page)]);
            }
        },
        echo: function(echo) {
            console.log(_.map(echo,function(arg) {
                return self.evalExpr(arg).toString();
            }).join(' '));
        },
        error: function(error) {
            var msg = self.evalExpr(error);
            self.addError(msg);
        },
        if: function(iff) {
            var cond;
            if('defined' in iff) {
                var deflabel = self.inferenceLabel(iff.defined);
                cond = deflabel in self.labels;
            } else if('undefined' in iff) {
                var undeflabel = self.inferenceLabel(iff.undefined);
                cond = !(undeflabel in self.labels);
            } else if('expr' in iff) {
                cond = self.evalExpr(iff.expr);
            } else {
                this.addError('Internal error');
                return;
            }
            if(cond) {
                self.parseInsts(iff.thenBody);
            } else if(iff.elseBody !== null) {
                self.parseInsts(iff.elseBody);
            }
        }
    };

    if(code.line) {
        self.environment.__lineIndex__ = code.line;
    }

    var done = false;
    _.each(commands, function(fn, key) {
        var val = code[key];
        if(val) {
            fn(val);
            done = true;
        }
    });
    if(!done) {
        this.addError('Internal error');
    }
};

JS80.prototype.compileFile = function(fname) {
    var prevFilename = this.environment.__filename__;
    this.environment.__filename__ = fname;
    var f = fs.readFileSync(fname);
    try {
        var ast = parser.parse(f.toString());
        this.parseInsts(ast);
    } catch(e) {
        this.addError("Syntax error");
    }
    this.environment.__filename__ = prevFilename;
};

JS80.prototype.secondPass = function() {
    _.each(this.secondPassTasks, function(pass) {
        this.environment = _.clone(pass.info);
        var addr = this.evalExpr(pass.expr);
        if(!_.isNumber(addr)) {
            this.addError('Unknown label `' + addr + "'");
        } else {
            switch(pass.type) {
                case 'byte':
                    if(addr < -127 || addr > 255) {
                        this.addError('Value overflow');
                    } else {
                        pass.page.output[pass.offset] = miscutil.compl2(addr & 255);
                    }
                    break;
                case 'word':
                    if(addr < -32767 || addr > 65535) {
                        this.addError('Value overflow');
                    } else {
                        pass.page.output[pass.offset] = miscutil.compl2(addr & 255);
                        pass.page.output[pass.offset + 1] = miscutil.compl2((addr >> 8) & 255);
                    }
                    break;
                case 'relative':
                    var rel = addr - pass.next;
                    if(rel < -128 || rel > 127) {
                        this.addError('Value overflow');
                    } else {
                        pass.page.output[pass.offset] = miscutil.compl2(rel);
                    }
                    break;
                default:
                    this.addError('Internal error');
            }
        }
    }, this);
    this.secondPassTasks = [];
};

JS80.prototype.asm = function(code) {
    try {
        var ast = parser.parse(code);
        this.parseInsts(ast);
        this.secondPass();
    } catch(e) {
        this.addError('Syntax error');
    }
};

JS80.prototype.saveImage = function(fname) {
    if(!_.isEmpty(this.errors)) {
        throw new Error('Code has errors');
    }
    var image = this.image.build();
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
    _.each(this.labels, function(equ, label) {
        fs.appendFileSync(fname, util.format("%s: equ 0%sh\n", label, equ.toString(16)));
    });
};

JS80.prototype.defineLabel = function(name, value) {
    if(name[0] === '.') {
        if(name.indexOf('.') > 0) {
            this.addError('Invalid label name');
            return;
        }
        name = this.environment.__label__ + name;
    } else {
        this.environment.__label__ = name;
    }
    if(this.environment.__module__.length > 0) {
        name = this.environment.__module__ + '.' + name;
    }
    if(this.labels[name]) {
        this.addError('Label ' + name + ' already exists');
        return;
    }
    this.labels[name] = value || (this.image.page.origin + this.image.page.offset);
};

module.exports = JS80;
