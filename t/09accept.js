'use strict';

var assert = require('assert'),
	http = require('http'),
	Crixalis = require('../lib/controller.js'),
	c = new Crixalis(),
	server = http.createServer(c.handler());

c.router('/').to(function () {
	assert.ok(Array.isArray(this.types));
	assert.equal(this.types.length, this.params.types);
	this.body = this.types.join('#');
});

c.router('/_').set('types', ['text/javascript', 'application/javascript']).to(function () {
	assert.ok(Array.isArray(this.types));
	assert.equal(this.types.length, this.params.types);
	this.body = this.types.join('#');
});

module.exports = {
	'accept#simple': function () {
		assert.response(server, {
			url: '/?types=0',
		}, {
			status: 200,
			body: '',
		});

		assert.response(server, {
			url: '/?types=1',
			headers: {
				Accept: 'text/html'
			}
		}, {
			status: 200,
			body: 'text/html',
		});

		assert.response(server, {
			url: '/?types=4',
			headers: {
				Accept: 'text/*, text/html, text/plain, text/css'
			}
		}, {
			status: 200,
			body: 'text/*#text/html#text/plain#text/css',
		});
	},

	'accept#priority': function () {
		assert.response(server, {
			url: '/?types=1',
			headers: {
				Accept: 'text/html;q=0.1'
			}
		}, {
			status: 200,
			body: 'text/html',
		});

		assert.response(server, {
			url: '/?types=1',
			headers: {
				Accept: 'text/html;q=1'
			}
		}, {
			status: 200,
			body: 'text/html',
		});

		assert.response(server, {
			url: '/?types=0',
			headers: {
				Accept: 'text/html;q=0'
			}
		}, {
			status: 200,
			body: '',
		});

		assert.response(server, {
			url: '/?types=2',
			headers: {
				Accept: 'text/css;q=0, text/javascript;q=0.1, application/javascript'
			}
		}, {
			status: 200,
			body: 'application/javascript#text/javascript',
		});
	},

	'accept#router#type+subtype': function () {
		assert.response(server, {
			url: '/_?types=2',
			headers: {
				Accept: 'text/css;q=0, text/javascript;q=0.1, application/javascript'
			}
		}, {
			status: 200,
			body: 'application/javascript#text/javascript',
		});

		assert.response(server, {
			url: '/_?types=2',
			headers: {
				Accept: 'text/css, text/text;q=0.1, application/json'
			}
		}, {
			status: 404
		});

		assert.response(server, {
			url: '/_?types=2',
			headers: {
				Accept: 'text/javascript; q=0, text/text;q=0.1, application/json'
			}
		}, {
			status: 404
		});

		assert.response(server, {
			url: '/_?types=3',
			headers: {
				Accept: 'text/javascript; q=0.1, text/text;q=1, application/json'
			}
		}, {
			status: 200
		});

		assert.response(server, {
			url: '/_?types=3',
			headers: {
				Accept: 'application/javascript, text/text;q=1, application/json'
			}
		}, {
			status: 200
		});
	},
	'accept#router#type+*': function () {
		/* TODO */
		assert(1);
	},
	'accept#router#*': function () {
		/* TODO */
		assert(1);
	}
};
