'use strict';

var assert = require('assert'),
	http = require('http'),
	Crixalis = require('../../lib/controller.js'),
	c = new Crixalis(),
	server = http.createServer(c.handler()),
	plan = {};

c.router({ url: '/', methods: ['GET'] }).to(function () {
	assert.equal(this.params.p1, 1763);
	assert.equal(this.params.p2, 'test');
	assert.equal(this.params.p3, 'custom');
	assert.equal(this.params.user, 'fred');
	assert.equal(Object.keys(this.params).length, 4);
}).set('methods', ['POST']).to(function () {
	assert.equal(this.params.p1, 1763);
	assert.equal(this.params.p2, 'test');
	assert.equal(this.params.p3, 'custom');
	assert.equal(this.params.user, 'bob');
	assert.equal(this.params.pass, 'super pass');
	assert.equal(Object.keys(this.params).length, 5);
}).from('/kw').unset('methods').to(function() {
	assert.equal(Object.keys(this.params).length, 1);
	assert.equal(Object.keys(this.keywords).length, 2);
	assert(this.keywords.test1);
	assert(this.keywords.test2);
	assert.equal(this.params.test3, 754);
});

module.exports = {
	'params#GET': function () {
		assert.response(server, {
			url: '/?p1=1763;p2=test;p3=custom;user=fred',
			method: 'GET'
		}, {
			status: 200,
			'Content-Type': 'text/html'
		}, 'GET params');
	},
	'params#POST': function () {
		assert.response(server, {
			url: '/?p1=1763&p2=test&p3=custom&user=fred',
			method: 'POST',
			data: 'user=bob&pass=super+pass'
		}, {
			status: 200,
			'Content-Type': 'text/html'
		}, 'POST params');
	},
	'params#keywords': function () {
		assert.response(server, {
			url: '/kw?test1&test2&test3=754',
			method: 'GET'
		}, {
			status: 200
		}, 'Keywords');
	}
};
