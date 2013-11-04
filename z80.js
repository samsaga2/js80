'use strict';

var parser = require('./parser')
  , z80parser = require('./z80parser')
  , util = require('util')
  , _ = require('underscore')
  , fs = require('fs')
  , Image = require('./image')
  , miscutil = require('./miscutil')
  , path = require('path');

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
  this.map = 0;
  this.secondPassTasks = [];

  this.environment = {};
  this.macros = {};
  this.searchPath = ['.', 'msx'];

  this.info = {
    filename  : '',
    lineIndex : 1,
    label     : '',
    module    : ''
  };
}

Z80.prototype.catchError = function(fn) {
  try {
    fn.call(this);
  } catch(e) {
    if(!e.line) {
      e.line = this.info.lineIndex;
    }
    e.filename = this.info.filename;
    throw e;
  }
}

Z80.prototype.inferenceLabel = function(label, info) {
  info = info || this.info;
  if(label[0] === '.') {
    label = info.label + label;
  }
  if(label in this.environment) {
    return label;
  }
  if(info.module && label.split('.').length < 2) {
    label = info.module + '.' + label;
  }
  return label;
}

Z80.prototype.evalExpr = function(expr) {
  if (expr.id === '__here__') {
    return this.image.here();
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
      case '^':  return reduce(values, function(l, r) { return l^r; });
      case '|':  return reduce(values, function(l, r) { return l|r; });
      case '&':  return reduce(values, function(l, r) { return l&r; });
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
  try {
    var bytes = z80parser.parse(template);
    this.writeBytes(bytes);
  } catch(e) {
    throw new Error('Syntax error ' + template);
  }
}

Z80.prototype.writeBytes = function(bytes) {
  bytes = _.map(bytes, function(b, index) {
            if(_.isObject(b)) {
              b = _.clone(b);
              b.page = this.image.page;
              b.offset = this.image.page.offset + index;
              b.next = this.image.page.origin + this.image.page.offset + bytes.length;
              b.info = _.clone(this.info);
              this.secondPassTasks.push(b);
              return 0;
            } else {
              return b;
            }
          }, this);
  this.image.write(bytes);
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
  this.catchError(function() {
    _.each(insts, this.parseInst, this);
  });
}

Z80.prototype.parseInst = function(code) {
  if(_.isEmpty(code)) {
    return;
  }

  var self = this;
  var commands = {
    line: function(line) {
      self.info.lineIndex = line;
    },
    label: function (label) {
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
      self.map = self.evalExpr(map);
    },
    ds: function(ds) {
      var len = self.evalExpr(ds.len);
      var value = self.evalExpr(ds.value);
      return miscutil.fill(len, value);
    },
    dw: function(dw) {
      return _.flatten(_.map(dw, function(i) {
                         var addr = self.evalExpr(i);
                         if(_.isString(addr)) {
                           return [{type:'low', label:addr}, {type:'high', label:addr}];
                         }
                         return [addr&255, addr>>8];
                       }, self));
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
      self.info.module = module;
    },
    endmodule: function() {
      self.info.module = '';
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
        throw new Error('File not found');
      }
    },
    incbin: function(incbin) {
      var data = fs.readFileSync(incbin.file);
      var skip = incbin.skip ? self.evalExpr(incbin.skip) : 0;
      var len  = incbin.len  ? self.evalExpr(incbin.len)  : data.length;
      return Array.prototype.slice.call(data, skip, skip+len);
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
    },
    defpage: function(defpage) {
      var index = self.evalExpr(defpage.index);
      self.image.pages[index].origin = self.evalExpr(defpage.origin);
      self.image.pages[index].size = self.evalExpr(defpage.size);
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
      console.log(_.map(echo, function(arg) {
                    return self.evalExpr(arg).toString();
                  }).join(' '));
    }
  };

  var done = false;
  _.each(commands, function(fn, key) {
    if(key in code) {
      done = true;
      var bytes = fn(code[key]);
      if(bytes) {
        this.writeBytes(bytes);
      }
    }
  }, this);
  if(!done) {
    throw new Error('Internal error');
  }
}

Z80.prototype.compileFile = function(fname) {
  var prevFilename = this.info.filename;
  this.info.filename = fname;
  var f = fs.readFileSync(fname);
  var ast = parser.parse(f.toString());
  this.parseInsts(ast);
  this.info.filename = prevFilename;
}

Z80.prototype.secondPass = function() {
  this.catchError(function() {
    _.each(this.secondPassTasks, function(pass) {
      var addr = pass.value;
      if(pass.label) {
        addr = this.environment[this.inferenceLabel(pass.label, pass.info)];
        if(_.isUndefined(addr)) {
          this.info = _.clone(pass.info);
          throw new Error('Unknown label ' + pass.label);
        }
      }
      switch(pass.type) {
        case 'low':
          pass.page.output[pass.offset] = miscutil.compl2(addr&255);
          break;
        case 'high':
          pass.page.output[pass.offset] = miscutil.compl2((addr>>8)&255);
          break;
        case 'relative':
          var rel = addr - pass.next;
          if(rel < - 128 || rel > 127) {
            throw new Error('Offset too large');
          }
          pass.page.output[pass.offset] = miscutil.compl2(rel);
          break;
        default:
          throw new Error('Internal error');
      }
    }, this);
    this.secondPassTasks = [];
  });
}

Z80.prototype.asm = function(code) {
  var ast = parser.parse(code);
  this.parseInsts(ast);
  this.secondPass();
}

Z80.prototype.saveImage = function(fname) {
  var image = this.image.build();
  var buffer = new Buffer(image.length);
  for(var i = 0; i < image.length; i++) {
    buffer[i] = image[i];
  }
  fs.writeFileSync(fname, buffer, 'binary');
}

Z80.prototype.saveSymbols = function(fname) {
  fs.truncateSync(fname, 0);
  _.each(this.environment, function(equ, label) {
    fs.appendFileSync(fname, util.format("%s: equ 0%sh\n", label, equ.toString(16)));
  });
}

Z80.prototype.defineLabel = function(name, value) {
  if(name[0] === '.') {
    if(name.indexOf('.') > 0) {
      throw new Error('Invalid label name');
    }
    name = this.info.label + name;
  } else {
    this.info.label = name;
  }
  if(this.info.module.length > 0) {
    name = this.info.module + '.' + name;
  }
  if(this.environment[name]) {
    throw new Error('Label '+name+' already exists');
  }
  this.environment[name] = value || (this.image.page.origin + this.image.page.offset);
}

module.exports = Z80;
