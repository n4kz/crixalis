'use strict';

var assert = require('assert'),
	http = require('http'),
	methods = ['GET', 'POST', 'HEAD', 'OPTIONS'],
	Crixalis = require('../../lib/controller.js'),
	i = 0,
	c = new Crixalis(),
	server = http.createServer(c.handler()),
	counters = {
		error: 0,
		auto: 0,
		end: 0
	};

c.router({ url: '/' }).to(function () { i++ });

Object.keys(counters).forEach(function (event) {
	c.on(event, function () {
		counters[event]++;
		if (event === 'auto')
			this.select();
	});
});

module.exports = {
	'event#auto': function () {
		var tests = 0;

		methods.forEach(function (method) {
			assert.response(server, {
				url: '/',
				method: method 
			}, {
				status: 200,
				'Content-Type': 'text/html',
			}, function () {
				tests++;

				if (tests === methods.length) {
					assert.equal(counters.error, 0);
					assert.equal(counters.auto, tests);
					assert.equal(counters.end, tests);
					assert.equal(i, tests);
				}
			});
		});
	}
};
