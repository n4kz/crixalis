'use strict';

var assert = require('assert'),
	http = require('http'),
	Crixalis = require('../lib/controller.js'),
	c = new Crixalis(),
	server = http.createServer(c.handler()),
	plan = {};

c.router({ url: '/', methods: ['GET'] }).to(function () {
	assert.equal(this.params.p1, 1763);
	assert.equal(this.params.p2, 'test');
	assert.equal(this.params.p3, 'custom');
	assert.equal(this.params.user, 'fred');
}).set('methods', ['POST']).to(function () {
	assert.equal(this.params.p1, 1763);
	assert.equal(this.params.p2, 'test');
	assert.equal(this.params.p3, 'custom');
	assert.equal(this.params.user, 'bob');
	assert.equal(this.params.pass, 'super pass');
});

module.exports = {
	'params#GET': function () {
		assert.response(server, {
			url: '/?p1=1763;p2=test;p3=custom;user=fred',
			method: 'GET'
		}, {
			status: 200,
			'Content-Type': 'text/html'
		}, function () {});
	},
	'params#POST': function () {
		assert.response(server, {
			url: '/?p1=1763&p2=test&p3=custom&user=fred',
			method: 'POST',
			data: 'user=bob&pass=super+pass'
		}, {
			status: 200,
			'Content-Type': 'text/html'
		}, function () {});
	}
};
