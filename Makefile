# Basic port for tests
PORT=30000

test: compile
	CRIXALIS_PORT=$(PORT) vows --tap -i t/*.js

compile:
	coffee --compile t/lib/*.coffee t/*.coffee

docs:
	yuidoc

clean:
	rm -rf t/*.js t/lib/*.js t/tmp_*

all: test docs
