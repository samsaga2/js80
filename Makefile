MOCHA = ./node_modules/.bin/mocha
PEG = ./node_modules/.bin/pegjs

all: test

clean:
	rm -f parser.js util/test.rom
	rm -rf node_modules

parser.js: parser.pegjs
	$(PEG) parser.pegjs

z80parser.js: z80parser.pegjs
	$(PEG) z80parser.pegjs

test: parser.js z80parser.js
	$(MOCHA)

testrom: util/test.rom

util/test.rom: util/test.asm parser.js z80parser.js
	./util/js80asm util/test.asm util/test.rom

.PHONY: all test
