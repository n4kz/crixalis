'use strict';

var assert = require('assert'),
	Context = require('../lib/context.js'),
	events = {};

function Controller () {
	return this;
}

Controller.prototype.emit = function (event) {
	if (!events.hasOwnProperty(event)) {
		events[event] = 0;
	}

	events[event]++;
}

module.exports = {
	'Context()': function () {
		var controller = new Controller(),
			request = {
				method: 'GET',
				url: '/test?param=5&format=unknown',
				headers: {
					host: 'test.localhost'
				},
				connection: {
					remoteAddress: '127.0.0.1'
				}
			},
			response = {},
			context = new Context(controller, request, response);

		/* Context */
		assert(context instanceof Controller);
		assert.equal(context.emit, controller.emit);
		assert.equal(context.req, request);
		assert.equal(context.res, response);
		assert.equal(context.method, request.method);
		assert.equal(context.url, '/test');

		/* Params */
		assert.type(context.params, 'object');
		assert.equal(Object.keys(context.params).length, 2);
		assert.equal(context.params.param, 5);
		assert.equal(context.params.format, 'unknown');

		/* Auto event */
		assert.equal(events.auto, 1);
		assert.equal(Object.keys(events).length, 1);
	}
};
