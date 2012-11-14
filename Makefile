test:
	script/test.sh

docs:
	yuidoc

clean:
	rm *.gz *.def

all: test docs
