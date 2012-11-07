test:
	script/test.sh

docs:
	yuidoc

all: test docs
