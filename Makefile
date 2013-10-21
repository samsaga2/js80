MOCHA = ./node_modules/.bin/mocha
PEG = ./node_modules/.bin/pegjs

all: test

clean:
	rm -f parser.js util/test.rom

parser.js: parser.pegjs
	$(PEG) --track-line-and-column parser.pegjs

z80parser.js: z80parser.pegjs
	$(PEG) --track-line-and-column z80parser.pegjs

test: parser.js z80parser.js
	$(MOCHA)

testrom: util/test.rom

util/test.rom: util/test.asm parser.js z80parser.js
	./util/js80asm util/test.asm util/test.rom

debug:
	@pkill mocha; true
	$(MOCHA) --debug-brk &
	chromium-browser http://127.0.0.1:8080/debug?port=5858

.PHONY: all test debug
