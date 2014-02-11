'use strict';

var parser = require('./parser'),
    _ = require('underscore'),
    fs = require('fs'),
    miscutil = require('./miscutil'),
    path = require('path'),
    parseInst = require('./parseasminst'),
    evalExpr = require('./expr').evalExpr;

var commands = {};

commands.label = function (label, js80) {
    js80.defineLabel(label);
};

commands.body = function (body, js80) {
    js80.compileAST(body);
};

commands.asm = function (asm, js80) {
    if (asm.execmacro && asm.inst in js80.macros) {
        js80.executeMacro(asm.inst, asm.args || []);
    } else {
        try {
            var bytes = parseInst.parse(asm, js80.env);
            js80.writeBytes(bytes);
        } catch (e) {
            js80.addError('Invalid asm instruction');
        }
    }
};

commands.org = function (org, js80) {
    js80.image.currentPage.origin = evalExpr(org, js80.env);
};

commands.map = function (map, js80) {
    js80.env.setGlobal('__map__', evalExpr(map, js80.env));
};

commands.struct = function (struct, js80) {
    var env = js80.env;
    var savedMap = env.get('__map__');

    env.push();
    env.set('__struct__', struct.name);
    env.setGlobal('__map__', 0);
    js80.compileAST(struct.body);

    var size = env.get('__map__');
    var sizeLabel = struct.name + '.size';
    env.setGlobal(sizeLabel, size);

    js80.env.setGlobal('__map__', savedMap);
    env.pop();
};


commands.ds = function (ds, js80) {
    var len = evalExpr(ds.len, js80.env);
    var value = evalExpr(ds.value, js80.env);
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
        var r = evalExpr(i, js80.env);
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
    var value = evalExpr(equ.value, js80.env);
    js80.defineLabel(equ.label, value);
};

commands.assign = function (assign, js80) {
    var value = evalExpr(assign.value, js80.env);
    js80.env.setGlobal(assign.label, value);
};

commands.module = function (module, js80) {
    js80.env.set('__module__', module);
};

commands.endmodule = function (endmodule, js80) {
    js80.env.set('__module__', '');
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
    var skip = incbin.skip ? evalExpr(incbin.skip, js80.env) : 0;
    var len = incbin.len ? evalExpr(incbin.len, js80.env) : data.length;
    js80.writeBytes(Array.prototype.slice.call(data, skip, skip + len));
};

commands.macro = function (macro, js80) {
    js80.macros[macro.id] = macro;
};

commands.repeat = function (repeat, js80) {
    var n = evalExpr(repeat.count, js80.env);
    _.each(_.range(n), function () {
        js80.compileAST(repeat.body);
    });
};

commands.rotate = function (rotate, js80) {
    var n = evalExpr(rotate, js80.env);
    var args = js80.env.get('__arguments__').rotate(n);
    js80.env.set('__arguments__', args);
};

commands.defpage = function (defpage, js80) {
    var pages;
    if (_.isNumber(defpage.index)) {
        pages = [defpage.index];
    } else if ('start' in defpage.index) {
        var start = evalExpr(defpage.index.start, js80.env);
        var end = evalExpr(defpage.index.end, js80.env);
        pages = _.range(start, end + 1);
    }
    _.each(pages, function (index) {
        js80.image.pages[index].origin = evalExpr(defpage.origin, js80.env);
        js80.image.pages[index].size = evalExpr(defpage.size, js80.env);
    });
};

commands.page = function (page, js80) {
    if (_.isNumber(page)) {
        js80.image.selectPage([evalExpr(page, js80.env)]);
    } else {
        var start = evalExpr(page.start, js80.env);
        var end = evalExpr(page.end, js80.env);
        js80.image.selectPage(_.range(start, end + 1));
    }
};

commands.echo = function (echo, js80) {
    console.log(_.map(echo,function (arg) {
        return evalExpr(arg, js80.env).toString();
    }).join(' '));
};

commands.error = function (error, js80) {
    var msg = evalExpr(error, js80.env);
    js80.addError(msg);
};

commands.if = function (iff, js80) {
    var cond;
    if ('defined' in iff) {
        var deflabel = js80.env.inferenceLabel(iff.defined);
        cond = js80.env.has(deflabel);
    } else if ('undefined' in iff) {
        var undeflabel = js80.env.inferenceLabel(iff.undefined);
        cond = !js80.env.has(undeflabel);
    } else if ('expr' in iff) {
        cond = evalExpr(iff.expr, js80.env);
    } else {
        js80.addError('Internal error');
        return;
    }
    if (cond) {
        js80.compileAST(iff.thenBody);
    } else if (iff.elseBody !== null) {
        js80.compileAST(iff.elseBody);
    }
};

module.exports.write = function (js80, code) {
    if (_.isEmpty(code)) {
        return;
    }

    js80.env.setGlobal('$', js80.image.here());

    if (code.line) {
	var macro = js80.env.get('__macro__');
	if(macro != '') {
            js80.env.set('__macroLineIndex__', code.line);
	} else {
            js80.env.set('__lineIndex__', code.line);
	}
    }

    var done = false;
    _.each(commands, function (fn, key) {
        if (key in code) {
            done = true;
            try {
                fn(code[key], js80);
            } catch (e) {
                js80.addError(e.message);
            }
        }
    });
    if (!done) {
        js80.addError('Internal error');
    }
};
