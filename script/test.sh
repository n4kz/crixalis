#!/bin/bash
for plan in t/*
do
	ok=$(expresso -d $plan 2>&1 | grep -oP '\d+ (?=tests)')

	if [ $? -ne 0 ]; then
		exit $?
	else
		printf "    %-16s %2i ok\n" $plan $ok
	fi
done
