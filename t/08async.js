'use strict';

var assert = require('assert'),
	http = require('http'),
	Crixalis = require('../lib/controller.js'),
	c = new Crixalis(),
	server = http.createServer(c.handler());

c.router({
	async: true
}).from('/json').to(function () {
	this.view = 'json';
	this.stash.json = {
		body: 'html'
	};

	setTimeout(this.render.bind(this), 50);
}).from('/html').to(function () {
	this.body = 'html';

	setTimeout(this.render.bind(this), 50);
});

c.router({
	url: '/html2',
	async: false
}).to(function () {
	this.body = 'html2';
	this.async = true;

	setTimeout(this.render.bind(this), 50);
});

c.router({
	url: '/html3'
}).to(function () {
	return false;
});

module.exports = {
	'async#route': function () {
		assert.response(server, {
			url: '/html'
		}, {
			status: 200,
			body: 'html',
			'Content-Type': 'text/html'
		}, 'Async html view');

		assert.response(server, {
			url: '/json'
		}, {
			status: 200,
			body: /"body":"html"/,
			'Content-Type': 'application/json'
		}, 'Async json view');
	},
	'async#callback': function () {
		assert.response(server, {
			url: '/html2'
		}, {
			status: 200,
			body: 'html2'
		}, 'Async callback');
	},
	'async#skip': function () {
		assert.response(server, {
			url: '/html3',
			method: 'HEAD'
		}, {
			status: 404
		}, 'Skip callback');
	}
};
