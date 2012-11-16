compile:
	coffee --lint --compile  t/lib/*.coffee t/*.coffee

test: compile
	vows -i --tap t/09accept.js

expresso:
	script/test.sh

docs:
	yuidoc

clean:
	rm *.gz *.def t/*.js t/lib/*.js

all: test docs
