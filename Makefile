MOCHA = ./node_modules/.bin/mocha

all: test

test:
	$(MOCHA)

.PHONY: all test
