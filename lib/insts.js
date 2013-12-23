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
    js80.writeInsts(body);
};

commands.asm = function (asm, js80) {
    if (asm.execmacro && asm.inst in js80.macros) {
        js80.environment.push();
        js80.environment.defineLocal('__macro__', asm.inst);
        js80.executeMacro(asm.inst, asm.args || []);
        js80.environment.pop();
    } else {
        try {
            var bytes = parseInst.parse(asm, js80.environment);
            js80.writeBytes(bytes);
        } catch (e) {
            js80.addError('Syntax error');
        }
    }
};

commands.org = function (org, js80) {
    js80.image.currentPage.origin = evalExpr(org, js80.environment);
};

commands.map = function (map, js80) {
    js80.environment.defineLabel('__map__', evalExpr(map, js80.environment));
};

commands.struct = function (struct, js80) {
    var env = js80.environment;
    var savedMap = env.get('__map__');

    env.push();
    env.defineLocal('__struct__', struct.name);
    env.defineLabel('__map__', 0);
    js80.writeInsts(struct.body);

    var size = env.get('__map__');
    var sizeLabel = struct.name + '.size';
    env.defineLabel(sizeLabel, size);

    js80.environment.defineLabel('__map__', savedMap);
    env.pop();
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

module.exports.write = function (js80, code) {
    if (_.isEmpty(code)) {
        return;
    }

    js80.environment.defineLabel('$', js80.image.here());
    if (code.line) {
        js80.environment.defineLocal('__lineIndex__', code.line);
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
