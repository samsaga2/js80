MOCHA = ./node_modules/.bin/mocha
PEG = ./node_modules/.bin/pegjs
ASM = ./bin/js80asm
MSXLIB := $(shell find msx -name '*.asm')

all: test

clean:
	rm -f *.rom lib/parser.js lib/z80parser.js

lib/parser.js: parser.pegjs
	$(PEG) --track-line-and-column --cache parser.pegjs lib/parser.js

lib/z80parser.js: z80parser.pegjs
	$(PEG) --track-line-and-column --cache z80parser.pegjs lib/z80parser.js

test: lib/parser.js lib/z80parser.js
	$(MOCHA)

hello.rom:
	$(ASM) -o hello.rom examples/hello.asm

hello32k.rom:
	$(ASM) -o hello32k.rom examples/hello32k.asm

debug:
	@pkill mocha; true
	$(MOCHA) --debug-brk &
	chromium-browser http://127.0.0.1:8080/debug?port=5858

.PHONY: all test debug hello.rom hello32k.rom
