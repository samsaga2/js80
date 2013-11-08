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

function JS80() {
  this.image = new Image();
  this.map = 0;
  this.secondPassTasks = [];

  this.environment = {};
  this.macros = {};
  this.searchPath = ['.', path.resolve(__dirname, '../msx')];

  this.info = {
    filename  : '',
    lineIndex : 1,
    label     : '',
    module    : ''
  };
}

JS80.prototype.catchError = function(fn) {
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

JS80.prototype.inferenceLabel = function(label, info) {
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

JS80.prototype.evalExpr = function(expr) {
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
  if('eq' in expr) {
    var eqleft = this.evalExpr(expr.eq.left);
    var eqright = this.evalExpr(expr.eq.right);
    return eqleft===eqright ? 1:0;
  }
  if('neq' in expr) {
    var neqleft = this.evalExpr(expr.neq.left);
    var neqright = this.evalExpr(expr.neq.right);
    return neqleft!==neqright ? 1:0;
  }
  if('lt' in expr) {
    var ltleft = this.evalExpr(expr.lt.left);
    var ltright = this.evalExpr(expr.lt.right);
    return ltleft<ltright ? 1:0;
  }
  if('gt' in expr) {
    var gtleft = this.evalExpr(expr.gt.left);
    var gtright = this.evalExpr(expr.gt.right);
    return gtleft>gtright ? 1:0;
  }
  if('le' in expr) {
    var leleft = this.evalExpr(expr.le.left);
    var leright = this.evalExpr(expr.le.right);
    return leleft<=leright ? 1:0;
  }
  if('ge' in expr) {
    var geleft = this.evalExpr(expr.ge.left);
    var geright = this.evalExpr(expr.ge.right);
    return geleft>=geright ? 1:0;
  }

  throw new Error('Internal error');
}

JS80.prototype.buildTemplateArg = function(arg) {
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

JS80.prototype.parseAsmInst = function(ast) {
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

JS80.prototype.writeBytes = function(bytes) {
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

JS80.prototype.executeMacro = function(id, args) {
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

JS80.prototype.parseInsts = function(insts) {
  this.catchError(function() {
    _.each(insts, this.parseInst, this);
  });
}

JS80.prototype.parseInst = function(code) {
  if(_.isEmpty(code)) {
    return;
  }

  var self = this;
  var commands = {
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
      self.writeBytes(miscutil.fill(len, value));
    },
    dw: function(dw) {
      _.flatten(_.map(dw, function(i) {
                  var addr = self.evalExpr(i);
                  if(_.isString(addr)) {
                    self.writeBytes([{type:'low', label:addr}, {type:'high', label:addr}]);
                  } else {
                    self.writeBytes([addr&255, addr>>8]);
                  }
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
      self.writeBytes(Array.prototype.slice.call(data, skip, skip+len));
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
      self.environment.__arguments__ = self.environment.__arguments__.rotate(n);
    },
    defpage: function(defpage) {
      var pages;
      if('start' in defpage.index) {
        var start = self.evalExpr(defpage.index.start);
        var end = self.evalExpr(defpage.index.end);
        pages =_.range(start, end + 1);
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
      console.log(_.map(echo, function(arg) {
                    return self.evalExpr(arg).toString();
                  }).join(' '));
    },
    if: function(iff) {
      var cond;
      if('defined' in iff) {
        var deflabel = self.inferenceLabel(iff.defined);
        cond = deflabel in self.environment;
      } else if('undefined' in iff) {
        var undeflabel = self.inferenceLabel(iff.undefined);
        cond = !(undeflabel in self.environment);
      } else if('expr' in iff) {
        cond = self.evalExpr(iff.expr);
      } else {
        throw new Error('Internal if error');
      }
      if(cond) {
        self.parseInsts(iff.thenBody);
      } else if(iff.elseBody !== null) {
        self.parseInsts(iff.elseBody);
      }
    }
  };

  if(code.line) {
    self.info.lineIndex = code.line;
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
    throw new Error('Internal error');
  }
}

JS80.prototype.compileFile = function(fname) {
  var prevFilename = this.info.filename;
  this.info.filename = fname;
  var f = fs.readFileSync(fname);
  var ast = parser.parse(f.toString());
  this.parseInsts(ast);
  this.info.filename = prevFilename;
}

JS80.prototype.secondPass = function() {
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

JS80.prototype.asm = function(code) {
  var ast = parser.parse(code);
  this.parseInsts(ast);
  this.secondPass();
}

JS80.prototype.saveImage = function(fname) {
  var image = this.image.build();
  var buffer = new Buffer(image.length);
  for(var i = 0; i < image.length; i++) {
    buffer[i] = image[i];
  }
  fs.writeFileSync(fname, buffer, 'binary');
}

JS80.prototype.saveSymbols = function(fname) {
  fs.truncateSync(fname, 0);
  _.each(this.environment, function(equ, label) {
    fs.appendFileSync(fname, util.format("%s: equ 0%sh\n", label, equ.toString(16)));
  });
}

JS80.prototype.defineLabel = function(name, value) {
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

module.exports = JS80;
