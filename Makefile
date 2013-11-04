MOCHA = ./node_modules/.bin/mocha
PEG = ./node_modules/.bin/pegjs
ASM = ./bin/js80asm
MSXLIB := $(shell find msx -name '*.asm')

all: test

clean:
	rm -f parser.js z80parser.js *.rom

parser.js: parser.pegjs
	$(PEG) --track-line-and-column parser.pegjs

z80parser.js: z80parser.pegjs
	$(PEG) --track-line-and-column z80parser.pegjs

test: parser.js z80parser.js
	$(MOCHA)

hello.rom: examples/hello.asm $(MSXLIB)
	$(ASM) -o hello.rom examples/hello.asm

hello32k.rom: examples/hello32k.asm $(MSXLIB)
	$(ASM) -o hello32k.rom examples/hello32k.asm

debug:
	@pkill mocha; true
	$(MOCHA) --debug-brk &
	chromium-browser http://127.0.0.1:8080/debug?port=5858

.PHONY: all test debug
