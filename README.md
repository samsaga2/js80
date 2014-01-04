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

`npm install js80 -g`


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


# JS80 class #

## Creation ##

```javascript
var JS80 = require('js80');
var js80 = new JS80();
```

## Class functions ##

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
| *module <name>* | Declares a module |
| *endmodule* | Ends module declaration |
| *macro <args>* | Declares a macro |
| *endmacro* | Ends macro declaration |
| *ifdef <label>* | Branch if label is defined |
| *ifndef <label>* | Branch if label is not defined |
| *if <cond>* | Branch if cond is not zero |
| *else* | Else branch |
| *endif* | Ends branching |
| *repeat <num>* | Repeat block of code <num> times |
| *endrepeat* | End repeats code block |
| *include "filename"* | Include another source file |
| *incbin "filename"* | Include a binary file |
| *rotate <arg>* | Rotate macro variable arguments |
| *map <num>* | TODO |
| *# <num>* | TODO |
| *org <num>* | TODO |
| *defpage <page>, <origin>, <size>* | TODO |
| *page <page>* | TODO |
| *echo e1, e2, ...* | TODO |
| *error "msg"* | TODO |
| *db e1, e2, ...* | TODO |
| *dw e1, e2, ...* | TODO |
| *dw* | TODO |
| *equ* | TODO |


## Expressions ##

| Expr |  Desc |
|------|-------|
| 11001100b, 0b11001100b | binary number |
| 0x1a, 01ah, $1a | hexadecimal number |
| $ | current address |
| -n |  negate a number |
| i-j | substract two numbers |
| i+j | sum two numbers |
| i*j | mult two numbers |
| i/j | div two numbers |
| i4j | division module |
| (i) | group expression |
| i<<j | shift left |
| i>>j | shift right |
| i^j | xor |
| i|j | or |
| i&j | and |
| "str" | string |
| 'i' | char |
| # nbytes | get map and move it nbytes |
| @0 | macro arguments length |
| @number | get macro argument (start from 1) |


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


# Opcodes #

| Mnemonic | Z80 Timing | R800 Timing | Opcodes |
|----------|------------|-------------|---------|
|ADC A,(HL)|7|2|8E|
|ADC A,(IX+o)|19|5|DD 8E oo|
|ADC A,(IY+o)|19|5|FD 8E oo|
|ADC A,n|7|2|CE nn|
|ADC A,r|4|1|88+r|
|ADC A,IXp|8|2|DD 88+p|
|ADC A,IYq|8|2|FD 88+q|
|ADC HL,BC|15|2|ED 4A|
|ADC HL,DE|15|2|ED 5A|
|ADC HL,HL|15|2|ED 6A|
|ADC HL,SP|15|2|ED 7A|
|ADD A,(HL)|7|2|86|
|ADD A,(IX+o)|19|5|DD 86 oo|
|ADD A,(IY+o)|19|5|FD 86 oo|
|ADD A,n|7|2|C6 nn|
|ADD A,r|4|1|80+r|
|ADD A,IXp|8|2|DD 80+p|
|ADD A,IYq|8|2|FD 80+q|
|ADD HL,BC|11|1|09|
|ADD HL,DE|11|1|19|
|ADD HL,HL|11|1|29|
|ADD HL,SP|11|1|39|
|ADD IX,BC|15|2|DD 09|
|ADD IX,DE|15|2|DD 19|
|ADD IX,IX|15|2|DD 29|
|ADD IX,SP|15|2|DD 39|
|ADD IY,BC|15|2|FD 09|
|ADD IY,DE|15|2|FD 19|
|ADD IY,IY|15|2|FD 29|
|ADD IY,SP|15|2|FD 39|
|AND (HL)|7|2|A6|
|AND (IX+o)|19|5|DD A6 oo|
|AND (IY+o)|19|5|FD A6 oo|
|AND n|7|2|E6 nn|
|AND r|4|1|A0+r|
|AND IXp|8|2|DD A0+p|
|AND IYq|8|2|FD A0+q|
|BIT b,(HL)|12|3|CB 46+8*b|
|BIT b,(IX+o)|20|5|DD CB oo 46+8*b|
|BIT b,(IY+o)|20|5|FD CB oo 46+8*b|
|BIT b,r|8|2|CB 40+8*b+r|
|CALL C,nn|17/10|5/3|DC nn nn|
|CALL M,nn|17/10|5/3|FC nn nn|
|CALL NC,nn|17/10|5/3|D4 nn nn|
|CALL NZ,nn|17/10|5/3|C4 nn nn|
|CALL P,nn|17/10|5/3|F4 nn nn|
|CALL PE,nn|17/10|5/3|EC nn nn|
|CALL PO,nn|17/10|5/3|E4 nn nn|
|CALL Z,nn|17/10|5/3|CC nn nn|
|CALL nn|17|5|CD nn nn|
|CCF|4|1|3F|
|CP (HL)|7|2|BE|
|CP (IX+o)|19|5|DD BE oo|
|CP (IY+o)|19|5|FD BE oo|
|CP n|7|2|FE nn|
|CP r|4|1|B8+r|
|CP IXp|8|2|DD B8+p|
|CP IYq|8|2|FD B8+q|
|CPD|16|4|ED A9|
|CPDR|21/16|4|ED B9|
|CPI|16|4|ED A1|
|CPIR|21/16|4|ED B1|
|CPL|4|1|2F|
|DAA|4|1|27|
|DEC (HL)|11|4|35|
|DEC (IX+o)|23|7|DD 35 oo|
|DEC (IY+o)|23|7|FD 35 oo|
|DEC BC|6|1|0B|
|DEC DE|6|1|1B|
|DEC HL|6|1|2B|
|DEC IX|10|2|DD 2B|
|DEC IY|10|2|FD 2B|
|DEC A|4|1|3D|
|DEC B|4|1|05|
|DEC C|4|1|0D|
|DEC D|4|1|15|
|DEC E|4|1|1D|
|DEC H|4|1|25|
|DEC IXp|8|2|DD 05+8*p|
|DEC IYq|8|2|FD 05+8*q|
|DEC L|4|1|2D|
|DEC SP|6|1|3B|
|DI|4|2|F3|
|DJNZ o|13/8|2|10 oo|
|EI|4|1|FB|
|EX (SP),HL|19|5|E3|
|EX (SP),IX|23|6|DD E3|
|EX (SP),IY|23|6|FD E3|
|EX AF,AF'|4|1|08|
|EX DE,HL|4|1|EB|
|EXX|4|1|D9|
|HALT|4|2|76|
|IM 0|8|3|ED 46|
|IM 1|8|3|ED 56|
|IM 2|8|3|ED 5E|
|IN A,(C)|12|3|ED 78|
|IN A,(n)|11|3|DB nn|
|IN B,(C)|12|3|ED 40|
|IN C,(C)|12|3|ED 48|
|IN D,(C)|12|3|ED 50|
|IN E,(C)|12|3|ED 58|
|IN H,(C)|12|3|ED 60|
|IN L,(C)|12|3|ED 68|
|IN F,(C)|12|3|ED 70|
|INC (HL)|11|4|34|
|INC (IX+o)|23|7|DD 34 oo|
|INC (IY+o)|23|7|FD 34 oo|
|INC BC|6|1|03|
|INC DE|6|1|13|
|INC HL|6|1|23|
|INC IX|10|2|DD 23|
|INC IY|10|2|FD 23|
|INC A|4|1|3C|
|INC B|4|1|04|
|INC C|4|1|0C|
|INC D|4|1|14|
|INC E|4|1|1C|
|INC H|4|1|24|
|INC L|4|1|2C|
|INC IXp|8|2|DD 04+8*p|
|INC IYq|8|2|FD 04+8*q|
|INC SP|6|1|33|
|IND|16|4|ED AA|
|INDR|21/16|4/3|ED BA|
|INI|16|4|ED A2|
|INIR|21/16|4/3|ED B2|
|JP (HL)|4|1|E9|
|JP (IX)|8|2|DD E9|
|JP (IY)|8|2|FD E9|
|JP C,nn|10|3|DA nn nn|
|JP M,nn|10|3|FA nn nn|
|JP NC,nn|10|3|D2 nn nn|
|JP NZ,nn|10|3|C2 nn nn|
|JP P,nn|10|3|F2 nn nn|
|JP PE,nn|10|3|EA nn nn|
|JP PO,nn|10|3|E2 nn nn|
|JP Z,nn|10|3|CA nn nn|
|JP nn|10|3|C3 nn nn|
|JR C,o|12/7|3/2|38 oo|
|JR NC,o|12/7|3/2|30 oo|
|JR NZ,o|12/7|3/2|20 oo|
|JR Z,o|12/7|3/2|28 oo|
|JR o|12|3|18 oo|
|LD (BC),A|7|2|02|
|LD (DE),A|7|2|12|
|LD (HL),n|10|3|36 nn|
|LD (HL),r|7|2|70+r|
|LD (IX+o),n|19|5|DD 36 oo nn|
|LD (IX+o),r|19|5|DD 70+r oo|
|LD (IY+o),n|19|5|FD 36 oo nn|
|LD (IY+o),r|19|5|FD 70+r oo|
|LD (nn),A|13|4|32 nn nn|
|LD (nn),BC|20|6|ED 43 nn nn|
|LD (nn),DE|20|6|ED 53 nn nn|
|LD (nn),HL|16|5|22 nn nn|
|LD (nn),IX|20|6|DD 22 nn nn|
|LD (nn),IY|20|6|FD 22 nn nn|
|LD (nn),SP|20|6|ED 73 nn nn|
|LD A,(BC)|7|2|0A|
|LD A,(DE)|7|2|1A|
|LD A,(HL)|7|2|7E|
|LD A,(IX+o)|19|5|DD 7E oo|
|LD A,(IY+o)|19|1|FD 7E oo|
|LD A,(nn)|13|4|3A nn nn|
|LD A,n|7|2|3E nn|
|LD A,r|4|1|78+r|
|LD A,IXp|8|2|DD 78+p|
|LD A,IYq|8|2|FD 78+q|
|LD A,I|9|2|ED 57|
|LD A,R|9|2|ED 5F|
|LD B,(HL)|7|2|46|
|LD B,(IX+o)|19|5|DD 46 oo|
|LD B,(IY+o)|19|5|FD 46 oo|
|LD B,n|7|2|06 nn|
|LD B,r|4|1|40+r|
|LD B,IXp|8|2|DD 40+p|
|LD B,IYq|8|2|FD 40+q|
|LD BC,(nn)|20|6|ED 4B nn nn|
|LD BC,nn|10|3|01 nn nn|
|LD C,(HL)|7|2|4E|
|LD C,(IX+o)|19|5|DD 4E oo|
|LD C,(IY+o)|19|5|FD 4E oo|
|LD C,n|7|2|0E nn|
|LD C,r|4|1|48+r|
|LD C,IXp|8|2|DD 48+p|
|LD C,IYq|8|2|FD 48+q|
|LD D,(HL)|7|2|56|
|LD D,(IX+o)|19|5|DD 56 oo|
|LD D,(IY+o)|19|5|FD 56 oo|
|LD D,n|7|2|16 nn|
|LD D,r|4|1|50+r|
|LD D,IXp|8|2|DD 50+p|
|LD D,IYq|8|2|FD 50+q|
|LD DE,(nn)|20|6|ED 5B nn nn|
|LD DE,nn|10|3|11 nn nn|
|LD E,(HL)|7|2|5E|
|LD E,(IX+o)|19|5|DD 5E oo|
|LD E,(IY+o)|19|5|FD 5E oo|
|LD E,n|7|2|1E nn|
|LD E,r|4|1|58+r|
|LD E,IXp|8|2|DD 58+p|
|LD E,IYq|8|2|FD 58+q|
|LD H,(HL)|7|2|66|
|LD H,(IX+o)|19|5|DD 66 oo|
|LD H,(IY+o)|19|5|FD 66 oo|
|LD H,n|7|2|26 nn|
|LD H,r|4|1|60+r|
|LD HL,(nn)|16|5|2A nn nn|
|LD HL,nn|10|3|21 nn nn|
|LD I,A|9|2|ED 47|
|LD IX,(nn)|20|6|DD 2A nn nn|
|LD IX,nn|14|4|DD 21 nn nn|
|LD IXh,n|11|3|DD 26 nn|
|LD IXh,p|8|2|DD 60+p|
|LD IXl,n|11|3|DD 2E nn|
|LD IXl,p|8|2|DD 68+p|
|LD IY,(nn)|20|6|FD 2A nn nn|
|LD IY,nn|14|4|FD 21 nn nn|
|LD IYh,n|11|3|FD 26 nn|
|LD IYh,q|8|2|FD 60+q|
|LD IYl,n|11|3|FD 2E nn|
|LD IYl,q|8|2|FD 68+q|
|LD L,(HL)|7|2|6E|
|LD L,(IX+o)|19|5|DD 6E oo|
|LD L,(IY+o)|19|5|FD 6E oo|
|LD L,n|7|2|2E nn|
|LD L,r|4|1|68+r|
|LD R,A|9|2|ED 4F|
|LD SP,(nn)|20|6|ED 7B nn nn|
|LD SP,HL|6|1|F9|
|LD SP,IX|10|2|DD F9|
|LD SP,IY|10|2|FD F9|
|LD SP,nn|10|3|31 nn nn|
|LDD|16|4|ED A8|
|LDDR|21/16|4|ED B8|
|LDI|16|4|ED A0|
|LDIR|21/16|4|ED B0|
|MULUB A,r||14|ED C1+8*r|
|MULUW HL,BC||36|ED C3|
|MULUW HL,SP||36|ED F3|
|NEG|8|2|ED 44|
|NOP|4|1|00|
|OR (HL)|7|2|B6|
|OR (IX+o)|19|5|DD B6 oo|
|OR (IY+o)|19|5|FD B6 oo|
|OR n|7|2|F6 nn|
|OR r|4|1|B0+r|
|OR IXp|8|2|DD B0+p|
|OR IYq|8|2|FD B0+q|
|OTDR|21/16|4/3|ED BB|
|OTIR|21/16|4/3|ED B3|
|OUT (C),A|12|3|ED 79|
|OUT (C),B|12|3|ED 41|
|OUT (C),C|12|3|ED 49|
|OUT (C),D|12|3|ED 51|
|OUT (C),E|12|3|ED 59|
|OUT (C),H|12|3|ED 61|
|OUT (C),L|12|3|ED 69|
|OUT (n),A|11|3|D3 nn|
|OUTD|16|4|ED AB|
|OUTI|16|4|ED A3|
|POP AF|10|3|F1|
|POP BC|10|3|C1|
|POP DE|10|3|D1|
|POP HL|10|3|E1|
|POP IX|14|4|DD E1|
|POP IY|14|4|FD E1|
|PUSH AF|11|4|F5|
|PUSH BC|11|4|C5|
|PUSH DE|11|4|D5|
|PUSH HL|11|4|E5|
|PUSH IX|15|5|DD E5|
|PUSH IY|15|5|FD E5|
|RES b,(HL)|15|5|CB 86+8*b|
|RES b,(IX+o)|23|7|DD CB oo 86+8*b|
|RES b,(IY+o)|23|7|FD CB oo 86+8*b|
|RES b,r|8|2|CB 80+8*b+r|
|RET C|11/5|3/1|D8|
|RET M|11/5|3/1|F8|
|RET NC|11/5|3/1|D0|
|RET NZ|11/5|3/1|C0|
|RET P|11/5|3/1|F0|
|RET PE|11/5|3/1|E8|
|RET PO|11/5|3/1|E0|
|RET Z|11/5|3/1|C8|
|RET|10|3|C9|
|RETI|14|5|ED 4D|
|RETN|14|5|ED 45|
|RL (HL)|15|5|CB 16|
|RL (IX+o)|23|7|DD CB oo 16|
|RL (IY+o)|23|7|FD CB oo 16|
|RL r|8|2|CB 10+r|
|RLA|4|1|17|
|RLC (HL)|15|5|CB 06|
|RLC (IX+o)|23|7|DD CB oo 06|
|RLC (IY+o)|23|7|FD CB oo 06|
|RLC r|8|2|CB 00+r|
|RLCA|4|1|07|
|RLD|18|5|ED 6F|
|RR (HL)|15|5|CB 1E|
|RR (IX+o)|23|7|DD CB oo 1E|
|RR (IY+o)|23|7|FD CB oo 1E|
|RR r|8|2|CB 18+r|
|RRA|4|1|1F|
|RRC (HL)|15|5|CB 0E|
|RRC (IX+o)|23|7|DD CB oo 0E|
|RRC (IY+o)|23|7|FD CB oo 0E|
|RRC r|8|2|CB 08+r|
|RRCA|4|1|0F|
|RRD|18|5|ED 67|
|RST 0|11|4|C7|
|RST 8H|11|4|CF|
|RST 10H|11|4|D7|
|RST 18H|11|4|DF|
|RST 20H|11|4|E7|
|RST 28H|11|4|EF|
|RST 30H|11|4|F7|
|RST 38H|11|4|FF|
|SBC A,(HL)|7|2|9E|
|SBC A,(IX+o)|19|5|DD 9E oo|
|SBC A,(IY+o)|19|5|FD 9E oo|
|SBC A,n|7|2|DE nn|
|SBC A,r|4|1|98+r|
|SBC A,IXp|8|2|DD 98+p|
|SBC A,IYq|8|2|FD 98+q|
|SBC HL,BC|15|2|ED 42|
|SBC HL,DE|15|2|ED 52|
|SBC HL,HL|15|2|ED 62|
|SBC HL,SP|15|2|ED 72|
|SCF|4|1|37|
|SET b,(HL)|15|5|CB C6+8*b|
|SET b,(IX+o)|23|7|DD CB oo C6+8*b|
|SET b,(IY+o)|23|7|FD CB oo C6+8*b|
|SET b,r|8|2|CB C0+8*b+r|
|SLA (HL)|15|5|CB 26|
|SLA (IX+o)|23|7|DD CB oo 26|
|SLA (IY+o)|23|7|FD CB oo 26|
|SLA r|8|2|CB 20+r|
|SRA (HL)|15|5|CB 2E|
|SRA (IX+o)|23|7|DD CB oo 2E|
|SRA (IY+o)|23|7|FD CB oo 2E|
|SRA r|8|2|CB 28+r|
|SRL (HL)|15|5|CB 3E|
|SRL (IX+o)|23|7|DD CB oo 3E|
|SRL (IY+o)|23|7|FD CB oo 3E|
|SRL r|8|2|CB 38+r|
|SUB (HL)|7|2|96|
|SUB (IX+o)|19|5|DD 96 oo|
|SUB (IY+o)|19|5|FD 96 oo|
|SUB n|7|2|D6 nn|
|SUB r|4|1|90+r|
|SUB IXp|8|2|DD 90+p|
|SUB IYq|8|2|FD 90+q|
|XOR (HL)|7|2|AE|
|XOR (IX+o)|19|5|DD AE oo|
|XOR (IY+o)|19|5|FD AE oo|
|XOR n|7|2|EE nn|
|XOR r|4|1|A8+r|
|XOR IXp|8|2|DD A8+p|
|XOR IYq|8|2|FD A8+|
