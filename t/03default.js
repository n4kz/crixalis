'use strict';

var assert = require('assert'),
	http = require('http'),
	methods = ['GET', 'POST', 'HEAD', 'OPTIONS'],
	Crixalis = require('../lib/controller.js'),
	i = 0,
	j = 0,
	c = new Crixalis(),
	server = http.createServer(c.handler());

c.on('default', function () {
	i++;
	this.code = 403;
	this.emit('end');
});

c.router({ url: '/' }).to(function () {
	j++;
});

module.exports = {
	'event#default': function () {
		var ti = 0, tj = 0;

		methods.forEach(function (method) {
			assert.response(server, {
				url: '/default',
				method: method 
			}, {
				status: 403,
				'Content-Type': 'text/html',
			}, function () {
				ti++;

				if (ti === methods.length) {
					assert.equal(i, ti);
				}
			});

			assert.response(server, {
				url: '/',
				method: method 
			}, {
				status: 200,
				'Content-Type': 'text/html',
			}, function () {
				tj++;

				if (tj === methods.length) {
					assert.equal(j, tj);
				}
			});
		});
	}
};
