```
     __         ______ _______
    |__| ______/  __  \\   _  \
    |  |/  ___/>      </  /_\  \
    |  |\___ \/   --   \  \_/   \
/\__|  /____  >______  /\_____  /
\______|    \/       \/       \/
```

**js80** is a library and an assembler for **z80** cpu.


# Installation #

Using NPM:

`npm install js80 -g`

Binaries for Windows:

1. Download [https://github.com/samsaga2/js80/releases]
2. Add the directory bin to your PATH.


# Command line #

js80asm help:
```
  Usage: js80asm [options] <file ...>

  Options:

    -h, --help                     output usage information
    -V, --version                  output the version number
    -o, --output <file>            create binary compiled file (default a.out)
    -I, --include <dir1:dir2:...>  add directories into the search list
    -s, --sym <file>               create sym file
```

Examples:
```
js80asm test.asm

js80asm test2.asm -o test2.rom -s test2.sym

js80asm test3.asm -I include:../include2
```


# JS80 API #

## New instance ##

```javascript
var JS80 = require('js80');
var js80 = new JS80();
```

## methods ##

* *asm* _js80.asm(code)_
··Compile assembler code.
* *defineLabel* _js80.defineLabel(label, value)_
·· Defines a new label.
* *secondPass* _js80.secondPass()_
··Execute the second pass. The compiler evaluates the expressions because labels can be declared later.
* *buildImage* _js80.buildImage()_
··Returns an array of bytes with the compiled code.
* *saveImage* _js80.saveImage(fileName)_
··Save compiled code to a file.
* *saveSymbols* _js80.saveSymbols(fileName)_
··Save symbols to a file (useful for debugging).

Example:
```javascript
var JS80 = require('js80');
var js80 = new JS80();
js80.asm('xor a');
js80.secondPass();
js80.saveImage('a.out');
```


# Assembler #

| Inst | Desc |
|------|------|
| *label:* | Declares a variable |
| *.label:* | Declares a local label |
| *`// comment //`* | Comment code |
| *`/* comment */`* | Comment code |
| *; comment* | Comment code |
| *inst1\inst2\···\inst-n* | Multipe instructions per line |
| *module* <name> | Declares a module |
| *endmodule* | Ends module declaration |
| *macro <args>* | Declares a macro |
| *endmacro* | Ends macro declaration |
| *ifdef* <label> | Branch if label is defined |
| *ifndef* <label> | Branch if label is not defined |
| *if* <cond> | Branch if cond is not zero |
| *else* | Else branch |
| *endif* | Ends branching |
| *repeat* <num> | Repeat block of code <num> times |
| *endrepeat* | End repeats code block |
| *include* "filename" | Include another source file |
| *incbin* "filename", ?skip, ?length | Include a binary file |
| *rotate* <arg> | Rotate macro variable arguments |
| *map* <num> | TODO |
| <label> *#* <num> | TODO |
| *org* <num>*| TODO |
| *defpage* <page>, <origin>, <size> | TODO |
| *page* <pagenum> | TODO |
| *echo* e1, e2, ... | TODO |
| *error* "msg" | TODO |
| *db* e1, e2, ... | TODO |
| *dw* e1, e2, ... | TODO |
| *dw* | TODO |
| <label> *equ* <expr> | TODO |
| *struct* <name> | Declares a struct |
| *endstruct* | Ends struct declaration |
| *code* | Does nothing (for sjasm compatibility) |
| *data* | Does nothing (for sjasm compatibility) |


## Expressions ##

| Expr                   | Desc                              |
| ------                 | -------                           |
| 11001100b, 0b11001100b | binary number                     |
| 0x1a, 01ah, $1a        | hexadecimal number                |
| $                      | current address                   |
| -n                     | negate a number                   |
| i-j                    | substract two numbers             |
| i+j                    | sum two numbers                   |
| i*j                    | mult two numbers                  |
| i/j                    | div two numbers                   |
| i%j                    | division module                   |
| (i)                    | group expression                  |
| i<<j                   | shift left                        |
| i>>j                   | shift right                       |
| i^j                    | xor                               |
| i&#124;j               | or                                |
| i&j                    | and                               |
| "str"                  | string                            |
| 'i'                    | char                              |
| # nbytes               | get map and move it nbytes        |
| @0                     | macro arguments length            |
| @number                | get macro argument (start from 1) |
| *str*(<expr>)          | convert identifier to string      |
| i==j                   | compare two expressions           |
| i!=j                   | compare two expressions           |
| i<=j                   | compare two expressions           |
| i>=j                   | compare two expressions           |
| i<j                    | compare two expressions           |
| i>j                    | compare two expressions           |

## Examples ##

```
run: ld b,100
.1:  ld a,(hl)
     inc a
     ld (hl),a
     inc hl
     djnz .1
     ret
unuseful:
     jr run.1
```

```
      module mod1
util: xor a
      ret
      endmodule

      // no module
main: call mod1.util ; calling a module label
      ret
```

```
macro noargs
    xor a
endmacro
```

```
macro withargs i, j
    ld a,i+j
endmacro
```

```
macro withdefaults i, j:1, k:2
    ld a,i+j+k
endmacro
```

```
macro varargs i, 1..*
    repeat @0
        ld a,i+@1
        rotate 1
    endrepeat
endmacro
```

```
struct spr
    y   # 1
    x   # 1
    col # 1
    pat # 1
endstruct

ld ix,sprite_data
ld a,(ix+spr.y)
ld b,(ix+spr.x)
ld hl,spr.size
```


# Assembler modules #

* bios.asm:
  MSX 2 Bios functions and variables (bios.WRTVRM, bios.H_KEYI, ...)
* rom16k.asm:
  MSX 16kb rom setup (start label is the entry point)
* rom32k.asm:
  MSX 32kb rom setup (start label is the entry point)
* megarom.asm:
  MSX megarom setup (start label is the entry point)
* extensions.asm:
  Misc utility macros
* math.asm:
  Misc math funcs
* debug.asm:
  OpenMSX debug output
