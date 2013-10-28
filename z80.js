'use strict';

var parser = require('./parser')
  , z80parser = require('./z80parser')
  , util = require('util')
  , _ = require('underscore')
  , fs = require('fs')
  , Image = require('./image');

function reduce(l, func) {
  return _.reduce(_.rest(l), function(memo, num) { return func(memo, num); }, _.first(l));
}

// http://stackoverflow.com/questions/1985260/javascript-array-rotate
Array.prototype.rotate = (function() {
                            var unshift = Array.prototype.unshift;
                            var splice = Array.prototype.splice;

                            return function(count) {
                              var len = this.length >>> 0;
                              count = count >> 0;
                              unshift.apply(this, splice.call(this, count % len, len));
                              return this;
                            };
})();

function Z80() {
  this.image = new Image();
  this.currentPage = this.image.pages[0];
  this.page = 0;

  this.map = 0;
  this.secondPass = [];

  this.environment = {};
  this.macros = {};

  this.currentFilename = '';
  this.currentLineIndex = 1;
  this.currentLabel = '';
  this.currentModule = '';
}

Z80.prototype.inferenceLabel = function(label) {
  if(label[0] === '.') {
    label = this.currentLabel + label;
  }
  if(label in this.environment) {
    return label;
  }
  if(this.currentModule && label.split('.').length < 2) {
    label = this.currentModule + '.' + label;
  }
  return label;
}

Z80.prototype.evalExpr = function(expr) {
  if (expr.id === '__here__') {
    return this.currentPage.offset + this.currentPage.origin;
  }
  if (expr.id) {
    var l = this.inferenceLabel(expr.id);
    if (l in this.environment) {
      return this.environment[l];
    }
  }
  if(expr.id) {
    return expr.id;
  }
  if('num' in expr) {
    return expr.num;
  }
  if(expr.neg) {
    return -this.evalExpr(expr.neg);
  }
  if(expr.paren) {
    return this.evalExpr(expr.paren);
  }
  if(expr.unary) {
    var values = _.map(expr.args, this.evalExpr, this);
    switch(expr.unary) {
      case '+':  return reduce(values, function(l, r) { return l+r; });
      case '-':  return reduce(values, function(l, r) { return l-r; });
      case '*':  return reduce(values, function(l, r) { return l*r; });
      case '/':  return reduce(values, function(l, r) { return l/r; });
      case '<<': return reduce(values, function(l, r) { return l<<r; });
      case '>>': return reduce(values, function(l, r) { return l>>r; });
    }
  }
  if(expr.str) {
    return expr.str;
  }
  if(expr.chr) {
    return expr.chr[0].charCodeAt(0);
  }
  if('arg' in expr) {
    var args = this.environment.__arguments__;
    var argIndex = this.evalExpr(expr.arg);
    if(argIndex === 0) {
      return args.length;
    }
    return args[argIndex-1];
  }
  if('getMap' in expr) {
    var mapLength = this.evalExpr(expr.getMap);
    var addr = this.map;
    this.map += mapLength;
    return addr;
  }

  throw new Error('Internal error');
}

Z80.prototype.buildTemplateArg = function(arg) {
  if(arg.paren) {
    var p = arg.paren;
    if('id' in p) {
      return util.format('(%s)', p.id);
    } else if('num' in p) {
      return util.format('(%d)', p.num);
    } else if(p.unary === '+' && ['ix','iy'].indexOf(p.args[0].id.toString().toLowerCase()) > -1) {
      var reg = p.args[0].id.toString().toLowerCase();
      var offset = this.evalExpr({unary:p.unary, args:_.rest(p.args)});
      if(offset < 0) {
        return util.format('(%s%d)', reg, offset);
      } else {
        return util.format('(%s+%d)', reg, offset);
      }
    } else {
      return this.buildTemplateArg(arg.paren);
    }
  } else {
    if(arg.str) {
      throw new Error('Invalid argument');
    }
    return this.evalExpr(arg).toString();
  }
}

Z80.prototype.parseAsmInst = function(ast) {
  var template = ast.inst;
  var sep = ' ';
  _.each(ast.args, function(arg) {
    template += sep + this.buildTemplateArg(arg);
    sep = ',';
  }, this);
  var bytes = z80parser.parse(template);
  this.image.write(this.parseBytes(bytes), this.page);
}

Z80.prototype.parseBytes = function(bytes) {
  bytes = _.map(bytes, function(b, index) {
           if(_.isObject(b)) {
             b.offset = this.currentPage.offset + index;
             b.next = this.currentPage.origin + this.currentPage.offset + bytes.length;
             this.secondPass.push(b);
             return 0;
           } else {
             return b;
           }
          }, this);
  this.currentPage.offset += bytes.length;
  return bytes;
}

Z80.prototype.executeMacro = function(id, args) {
  var macro = this.macros[id];

  // eval args
  var evalArgs = {};
  _.each(macro.args, function(macroArg) {
    if(macroArg.rest) {
      this.environment.__arguments__ = [];
      while(args.length) {
        this.environment.__arguments__.push(this.evalExpr(args.shift()));
      }
    } else {
      evalArgs[macroArg.id] = this.evalExpr(args.shift() || macroArg.default || {num:0});
    }
  }, this);

  // run macro
  var labels = this.environment;
  this.environment = _.extend(_.clone(this.environment), evalArgs);
  this.parseInsts(macro.body);
  this.environment = labels;
}

Z80.prototype.parseInsts = function(insts) {
  _.each(insts, this.parseInst, this);
}

Z80.prototype.parseInst = function(code) {
  if(_.isEmpty(code)) {
    return;
  }

  if(code.line) {
    this.currentLineIndex = code.line;
  }

  var self = this;
  var commands = {
    label: function (label) {
      self.defineLabel(label);
    },
    asm: function(asm) {
      if(asm.inst in self.macros) {
        self.executeMacro(asm.inst, asm.args || []);
      } else {
        self.parseAsmInst(asm);
      }
    },
    org: function(org) {
      self.currentPage.origin = self.evalExpr(org);
    },
    map: function(map) {
      self.map = self.evalExpr(map);
    },
    ds: function(ds) {
      var len = self.evalExpr(ds.len);
      var value = self.evalExpr(ds.value);
      return _.map(_.range(len), function() {return value;});
    },
    dw: function(dw) {
      return _.flatten(_.map(dw, function(i) { var ix = self.evalExpr(i); return [ix&255, ix>>8]; }, self));
    },
    db: function(db) {
      return _.flatten(_.map(db, function(i) {
                         var r = self.evalExpr(i);
                         if(_.isString(r)) {
                           return _.map(r, function(i) { return i.charCodeAt(0); });
                         } else {
                           return r;
                         }
                       }, self));
    },
    equ: function(equ) {
      self.defineLabel(equ.label, self.evalExpr(equ.value));
    },
    module: function(module) {
      self.currentModule = module;
    },
    endmodule: function() {
      self.currentModule = '';
    },
    include: function(include) {
      return self.compileFile(include);
    },
    incbin: function(incbin) {
      var f = fs.readFileSync(incbin);
      return Array.prototype.slice.call(f, 0)
    },
    macro: function(macro) {
      self.macros[macro.id] = macro;
    },
    repeat: function(repeat) {
      var n = self.evalExpr(repeat.count);
      _.each(_.range(n), function() {
        return self.parseInsts(repeat.body);
      }, self);
    },
    rotate: function(rotate) {
      var n = self.evalExpr(rotate);
      self.environment.__arguments__ = self.environment.__arguments__.rotate(n);
    }
  };

  var done = false;
  _.each(commands, function(fn, key) {
    if(key in code) {
      done = true;
      var bytes = fn(code[key]);
      if(bytes) {
        this.image.write(bytes, this.page);
      }
    }
  }, this);
  if(!done) {
    throw new Error('Internal error');
  }
}

Z80.prototype.compileFile = function(fname) {
  var prevFilename = this.currentFilename;
  this.currentFilename = fname;
  var f = fs.readFileSync(fname);
  this.asm(f.toString());
  this.currentFilename = prevFilename;
}

Z80.prototype.asmSecondPass = function() {
  _.each(this.secondPass, function(pass) {
    var addr = pass.value;
    if(pass.label) {
      addr = this.environment[this.inferenceLabel(pass.label)];
      if(_.isUndefined(addr)) {
        throw new Error('Unknown label ' + pass.label);
      }
    }
    switch(pass.type) {
      case 'low':
        this.currentPage.output[pass.offset] = this.image.compl2(addr&255);
        break;
      case 'high':
        this.currentPage.output[pass.offset] = this.image.compl2((addr>>8)&255);
        break;
      case 'relative':
        var rel = addr - pass.next;
        if(rel < - 128 || rel > 127) {
            throw new Error('Offset too large');
        }
        this.currentPage.output[pass.offset] = this.image.compl2(rel);
        break;
      default:
        throw new Error('Internal error');
    }
  }, this);
}

Z80.prototype.compileAst = function(ast) {
  this.secondPass = [];
  try {
    _.flatten(this.parseInsts(ast));
    this.asmSecondPass();
  } catch(e) {
    if(!e.line) {
      e.line = this.currentLineIndex;
    }
    e.filename = this.currentFilename;
    throw e;
  }
}

Z80.prototype.asm = function(code) {
  var ast = parser.parse(code);
  this.compileAst(ast);
}

Z80.prototype.buildImage = function() {
  return this.image.build();
}

Z80.prototype.saveImage = function(fname) {
  var image = this.buildImage();
  var buffer = new Buffer(image.length);
  for(var i = 0; i < image.length; i++) {
    buffer[i] = image[i];
  }
  fs.writeFileSync(fname, buffer, 'binary');
}

Z80.prototype.defineLabel = function(name, value) {
  if(name[0] === '.') {
    if(name.indexOf('.') > 0) {
      throw new Error('Invalid label name');
    }
    name = this.currentLabel + name;
  } else {
    this.currentLabel = name;
  }
  if(this.currentModule.length > 0) {
    name = this.currentModule + '.' + name;
  }
  if(this.environment[name]) {
    throw new Error('Label '+name+' already exists');
  }
  this.environment[name] = value || (this.currentPage.origin + this.currentPage.offset);
}

Z80.prototype.getLabel = function(name) {
  if(!this.environment[name]) {
    throw new Error('Unknow label ' + name);
  }
  return this.environment[name];
}

module.exports = Z80;
