'use strict';

var assert = require('assert'),
	http = require('http'),
	Crixalis = require('../lib/controller.js'),
	c = new Crixalis(),
	server = http.createServer(c.handler()),
	plan = {};

c.router()
	.from('/set')
	.to(function () {
		this.cookie({
			name: 'first',
			value: 256,
			domain: '.localhost'
		}).cookie({
			name: 'second',
			value: '123DFIQWE',
			domain: '.localhost'
		})

		assert.deepEqual(this.headers, {
			'Set-Cookie': [
				'first=256; domain=.localhost; path=/set',
				'second=123DFIQWE; domain=.localhost; path=/set'
			]
		});
	})
	.from('/get')
	.to(function () {
		assert.equal(this.cookies.test, 3124);
		assert.equal(this.cookies.foob, 'ok');
		assert.equal(Object.keys(this.cookies).length, 2);
	});

module.exports = {
	'cookie#set': function () {
		assert.response(server, {
			url: '/set?test=12',
			method: 'GET'
		}, {
			status: 200,
		}, 'Set cookie');
	},

	'cookie#get': function () {
		assert.response(server, {
			url: '/get?test=647',
			method: 'GET',
			headers: {
				Cookie: 'test=3124; foob=ok'
			}
		}, {
			status: 200,
		}, 'Get cookie');
	}
};
