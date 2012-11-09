'use strict';

var assert = require('assert'),
	http = require('http'),
	methods = ['GET', 'POST', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'],
	events = ['auto', 'end', 'error'],
	Crixalis = require('../lib/controller.js'),
	i = 0,
	c = new Crixalis(),
	server = http.createServer(c.handler()),
	counters = {},
	plan = {};

events.forEach(function (event) {
	c.on(event, function () {
		counters[event]++;
		if (event === 'auto') {
			this.select();
		}
	});
});

methods.forEach(function (method) {
	counters[method] = 0;

	c.router({ url: '/', method: method }).to(function () {
		var that = this;
		i++;
		counters[method]++;

		methods.forEach(function (m) {
			if (m === that.method) {
				assert(that['is_' + m.toLowerCase()]);
			} else {
				assert(!that['is_' + m.toLowerCase()]);
			}
		});
	});
});

methods.forEach(function (method) {
	var tests = 0;

	plan['methods#' + method] = function () {
		assert.response(server, {
			url: '/',
			method: method 
		}, {
			status: 200,
			'Content-Type': 'text/html'
		}, function () {
			tests++;

			if (tests === methods.length + events.length) {
				Object.keys(counters).forEach(function (counter) {
					switch (counter) {
						case 'error':
							assert.equal(counters.error, 0);
							break;

						case 'auto':
						case 'end':
							assert.equal(counters[counter], tests);
							break;

						default:
							assert.equal(counters[counter], 1);
					}
				});

				assert.equal(i, tests);
			}
		});
	};
});

module.exports = plan;
