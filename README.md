```
     __         ______ _______
    |__| ______/  __  \\   _  \
    |  |/  ___/>      </  /_\  \
    |  |\___ \/   --   \  \_/   \
/\__|  /____  >______  /\_____  /
\______|    \/       \/       \/
```

**js80** is a library and an assembler for **z80** cpu.

Installation
=================

`npm install js80 -g`

Command line
================

js80asm help:
```
  Usage: js80asm [options] <file ...>

  Options:

    -h, --help                     output usage information
    -V, --version                  output the version number
    -o, --output <file>            create binary compiled file (default a.out)
    -I, --include <dir1:dir2:...>  add directories into the search list
    -s, --sym <file>               create sym file
``

Examples:
```
js80asm test.asm

js80asm test2.asm -o test2.rom -s test2.sym

js80asm test3.asm -I include:../include2
```

Module
========

Example:
```
var JS80 = require('js80');
var js80 = new JS80();
js80.asm('xor a');
js80.saveImage('a.out');
```
