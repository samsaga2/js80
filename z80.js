'use strict';

var parser = require('./parser')
  , z80parser = require('./z80parser')
  , util = require('util')
  , _ = require('underscore')
  , fs = require('fs');

function reduce(l, func) {
  return _.reduce(_.rest(l), function(memo, num) { return func(memo, num); }, _.first(l));
}

function compl2(v) {
  return (v<0) ? (256+v) : v;
}

function Z80() {
  this.org = 0;
  this.offset = 0;
  this.secondPass = {};

  this.output = [];

  this.labels = {};
  this.macros = {};

  this.currentFilename = '';
  this.currentLineIndex = 1;
  this.currentLabel = '';
  this.currentModule = '';
  this.currentMacro = null;
}

Z80.prototype.inferenceLabel = function(label) {
  if(label[0] === '.') {
    label = this.currentLabel + label;
  }
  if(label in this.labels) {
    return label;
  }
  if(this.currentModule && label.split('.').length < 2) {
    label = this.currentModule + '.' + label;
  }
  return label;
}

Z80.prototype.evalExpr = function(expr) {
  if (expr.id === '__here__') {
    return this.offset + this.org;
  }
  if (expr.id) {
    var l = this.inferenceLabel(expr.id);
    if (l in this.labels) {
      return this.labels[l];
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

  throw new Error('Internal error');
}

Z80.prototype.buildTemplateArg = function(arg) {
  if('expr' in arg) {
    if(arg.expr.paren) {
      var p = arg.expr.paren;
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
      return this.evalExpr(arg.expr).toString();
    }
  } else {
    return arg;
  }
}

Z80.prototype.parseAsmInst = function(ast) {
  var template = ast.asm;
  var sep = ' ';
  _.each(ast.args, function(arg) {
    template += sep + this.buildTemplateArg(arg);
    sep = ',';
  }, this);
  var bytes = z80parser.parse(template);
  return this.parseBytes(bytes);
}

Z80.prototype.parseBytes = function(bytes) {
  bytes = _.map(bytes, function(b, index) {
           if(_.isObject(b)) {
             this.secondPass[this.offset + index] = b;
             b.next = this.org + this.offset + bytes.length;
             return 0;
           } else {
             return b;
           }
          }, this);
  this.offset += bytes.length;
  return bytes;
}

Z80.prototype.evalMacro = function(id, args) {
  var macro = this.macros[id];

  // eval args
  var evalArgs = _.object(_.map(macro.args, function(arg, i) {
                            return [
                                  arg.id,
                                  this.evalExpr(args[i] ? args[i].expr : arg.default.expr || 0)
                            ];
                          }, this));

  // run macro
  var labels = this.labels;
  this.labels = _.extend(_.clone(this.labels), evalArgs);
  var bytes = _.map(macro.body, this.parseInst, this);
  this.labels = labels;

  return bytes;
}

Z80.prototype.parseInst = function(code) {
  if(code.line) {
    this.currentLineIndex = code.line;
  }

  if(code.label) {
    this.defineLabel(code.label);
    return null;
  } else if('asm' in code) {
    if(code.asm in this.macros) {
      return this.evalMacro(code.asm, code.args || []);
    } else {
      return this.parseAsmInst(code);
    }
  } else if('org' in code) {
    this.org = this.evalExpr(code.org.expr);
    return null;
  } else if('ds' in code) {
    var len = this.evalExpr(code.ds.len.expr);
    var value = this.evalExpr(code.ds.value.expr);
    return _.map(_.range(len), function() {return value;});
  } else if('dw' in code) {
    return _.map(code.dw, function(i) { var ix = this.evalExpr(i.expr); return [ix&255, ix>>8]; }, this);
  } else if('db' in code) {
    return _.map(code.db, function(i) {
             if(i.str) {
               return _.map(i.str, function(i) { return i.charCodeAt(0); });
             } else {
               return this.evalExpr(i.expr);
             }
           }, this);
  } else if('equ' in code) {
    this.defineLabel(code.equ.label, this.evalExpr(code.equ.value.expr));
    return null;
  } else if('module' in code) {
    this.currentModule = code.module;
    return null;
  } else if(code.endmodule) {
    this.currentModule = '';
    return null;
  } else if('include' in code) {
    return this.compileFile(code.include);
  } else if('incbin' in code) {
    var f = fs.readFileSync(code.incbin);
    return Array.prototype.slice.call(f, 0)
  } else if('macro' in code) {
    if(this.currentMacro !== null) {
      throw new Error('Forbidden macro declaration');
    }
    this.currentMacro = {id:code.macro.id, args:code.macro.args, body:[]};
  } else {
    throw new Error('Internal error');
  }
}

Z80.prototype.compileFile = function(fname) {
    var prevFilename = this.currentFilename;
    this.currentFilename = fname;
    var f = fs.readFileSync(fname);
    var bytes = this.asm(f.toString());
    this.currentFilename = prevFilename;
    return bytes;
}

Z80.prototype.asmSecondPass = function(bytes) {
  _.each(this.secondPass, function(value, key) {
    var offset = value.value;
    if(value.label) {
      offset = this.labels[this.inferenceLabel(value.label)];
      if(_.isUndefined(offset)) {
        throw new Error('Unknown label ' + value.label);
      }
    }
    switch(value.type) {
      case 'low':
        bytes[key] = offset&255;
        break;
      case 'high':
        bytes[key] = (offset>>8)&255;
        break;
      case 'relative':
        var rel = offset - value.next;
        if(rel < - 128 || rel > 127) {
          throw new Error('Offset too large');
        }
        bytes[key] = rel;
        break;
      default:
        throw new Error('Internal error');
    }
  }, this);
  return bytes;
}

Z80.prototype.compileAst = function(ast) {
  this.secondPass = {};
  try {
    var offset = this.offset;
    var bytes = [];
    _.each(ast, function (ast) {
      if('endmacro' in ast) {
        this.macros[this.currentMacro.id] = this.currentMacro;
        this.currentMacro = null;
      } else if(this.currentMacro) {
        this.currentMacro.body = this.currentMacro.body.concat(ast);
      } else {
        var b = this.parseInst(ast);
        if(b !== null) {
          bytes = bytes.concat(b);
        }
      }
    }, this);
    bytes = _.map(this.asmSecondPass(_.flatten(bytes)), compl2);
    for(var i = 0; i < bytes.length; i++) {
      this.output[offset + i] = bytes[i];
    }
    return bytes;
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
  return this.compileAst(ast);
}

Z80.prototype.saveImage = function(fname) {
  var buffer = new Buffer(this.output.length);
  for(var i = 0; i < this.output.length; i++) {
    buffer[i] = this.output[i];
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
  if(this.labels[name]) {
    throw new Error('Label '+name+' already exists');
  }
  this.labels[name] = value || (this.org + this.offset);
}

Z80.prototype.getLabel = function(name) {
  if(!this.labels[name]) {
    throw new Error('Unknow label ' + name);
  }
  return this.labels[name];
}

module.exports = Z80;
