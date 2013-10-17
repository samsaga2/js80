MOCHA = ./node_modules/.bin/mocha
PEG = ./node_modules/.bin/pegjs

all: test

clean:
	rm -f parser.js
	rm -rf node_modules

parser.js: parser.pegjs
	$(PEG) parser.pegjs

z80parser.js: z80parser.pegjs
	$(PEG) z80parser.pegjs

test: parser.js z80parser.js
	$(MOCHA)

.PHONY: all test
