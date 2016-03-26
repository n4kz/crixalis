all: test

# Basic port for tests
PORT=30000

BIN=node_modules/.bin

test: compile
	CRIXALIS_PORT=$(PORT) $(BIN)/vows --spec -i t/*.js

compile: clean
	$(BIN)/coffee --compile t/lib/*.coffee t/*.coffee

clean:
	rm -rf t/*.js t/lib/*.js t/tmp_*

.PHONY: clean compile test
