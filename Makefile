compile:
	coffee --lint --compile  t/lib/*.coffee t/*.coffee

test: compile
	vows --tap -i t/*.js

docs:
	yuidoc

clean:
	rm *.gz *.def t/*.js t/lib/*.js

all: test docs
