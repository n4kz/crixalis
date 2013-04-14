# Port for test server
PORT=30000

test: compile
	CRIXALIS_PORT=$(PORT) vows --tap -i t/*.js

compile:
	coffee --lint --compile t/lib/*.coffee t/*.coffee

docs:
	yuidoc

clean:
	rm -f t/*.js t/lib/*.js

all: test docs
