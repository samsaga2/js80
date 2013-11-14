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
ifdef REPORT
	$(MOCHA) -g $(REPORT)
else
	$(MOCHA)
endif

hello.rom:
	$(ASM) -o hello.rom examples/hello.asm

hello32k.rom:
	$(ASM) -o hello32k.rom examples/hello32k.asm

debug:
	@pkill mocha; true
ifdef REPORT
	$(MOCHA) -g $(REPORT) --debug-brk
else
	$(MOCHA) --debug-brk
endif

.PHONY: all test debug hello.rom hello32k.rom
