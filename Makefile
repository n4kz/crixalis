export PATH := node_modules/.bin:$(PATH)
export CRIXALIS_PORT = 30000

all: test

test: compile
	vows --spec -i t/*.js

compile: clean
	coffee --compile t/lib/*.coffee t/*.coffee

clean:
	rm -rf t/*.js t/lib/*.js t/tmp_*

.PHONY: clean compile test
