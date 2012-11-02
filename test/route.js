'use strict';

var assert = require('assert'),
	Route  = require('../lib/route.js');

module.exports = {
	'new Route(c, \'/test\')': function () {
		var c = {},
			url = '/test',
			route = new Route(c, url);

		assert(route instanceof Route);
		assert.type(route.url, 'string');
		assert.equal(route.url, url);
		assert.equal(route.controller, c);
		assert.isUndefined(route.pattern);
	},

	'Route (c, \'/test\')': function () {
		var c = {},
			url = '/test',
			route = Route(c, url);

		assert(route instanceof Route);
		assert.equal(route.url, url);
		assert.equal(route.controller, c);
		assert.isUndefined(route.pattern);
	},

	'new Route (c, /test/)': function () {
		var c = {},
			pattern = /\/test/,
			route = new Route(c, pattern);

		assert(route instanceof Route);
		assert.equal(route.pattern, pattern);
		assert.equal(route.controller, c);
		assert.isUndefined(route.url);
	},

	'new Route (c, {})': function () {
		var c = {},
			url = '/test',
			options = { url: url },
			route = new Route(c, options);

		assert(route instanceof Route);
		assert.equal(route.url, url);
		assert.equal(route.controller, c);
		assert.isUndefined(route.pattern);
	},

	'new Route (c)': function () {
		var c = {},
			route = new Route(c);

		assert(route instanceof Route);
		assert.equal(route.controller, c);
		assert.isUndefined(route.url);
		assert.isUndefined(route.pattern);
	},

	'new Route (c, #null)': function () {
		var ok = false,
			route;

		try {
			route = new Route ({}, null);
		} catch (error) {
			assert(error instanceof Error);
			ok = true;
		} finally {
			assert(ok);
		}
	},

	'new Route (c, #function)': function () {
		var ok = false,
			route;

		try {
			route = new Route ({}, function () {});
		} catch (error) {
			assert(error instanceof Error);
			ok = true;
		} finally {
			assert(ok);
		}
	},

	'Route.from(#url)': function () {
		var route = new Route({}),
			url = '/test/';

		assert.equal(route.from(url), route);
		assert.equal(route.url, url);
		assert.isUndefined(route.pattern);
	},

	'Route.from(#pattern)': function () {
		var route = new Route({}),
			pattern = /test/;

		assert.equal(route.from(pattern), route);
		assert.equal(route.pattern, pattern);
		assert.isUndefined(route.url);
	},

	'Route.from(#object)': function () {
		var ok = false,
			route = new Route({});

		try {
			route.from({});
		} catch (error) {
			assert(error instanceof Error);
			ok = true;
		} finally {
			assert(ok);
		}
	},

	'Route.from(#null)': function () {
		var ok = false,
			route = new Route({});

		try {
			route.from(null);
		} catch (error) {
			assert(error instanceof Error);
			ok = true;
		} finally {
			assert(ok);
		}
	},

	'Route.from(#undefined)': function () {
		var ok = true,
			route = new Route({}, { url: 'test' });

		try {
			route.from();
		} catch (error) {
			ok = false;
		} finally {
			assert(ok);
		}

		assert.isUndefined(route.url);
		assert.isUndefined(route.pattern);
	},

	'Route.to(#undefined)': function () {
		var ok = false,
			route = new Route({}, '/test');

		try {
			route.to(undefined);
		} catch (error) {
			assert(error instanceof Error);
			ok = true;
		} finally {
			assert(ok);
		}
	},

	'Route.to(#null)': function () {
		var ok = false,
			route = new Route({}, /test/);

		try {
			route.to(null);
		} catch (error) {
			assert(error instanceof Error);
			ok = true;
		} finally {
			assert(ok);
		}
	},

	'Route.to(#function)': function () {
		var ok = false,
			route = new Route({
				route: function (how, where) {
					ok = true;
					assert.equal(where, callback);
					assert.equal(how, route);
				}
			}),
			callback = function () {};

		assert.equal(route.from('test').to(callback), route);
		assert(ok);
	},

	'Route.from(#undefined).to(#function)': function () {
		var ok = false,
			route = new Route({});

		try {
			route.to(function () {});
		} catch (error) {
			assert(error instanceof Error);
			ok = true;
		} finally {
			assert(ok);
		}
	},

	'Route.set(#null)': function () {
		var ok = false,
			route = new Route({});

		try {
			route.set(null);
		} catch (error) {
			assert(error instanceof Error);
			ok = true;
		} finally {
			assert(ok);
		}
	},

	'Route.set(#function)': function () {
		var ok = false,
			route = new Route({});

		try {
			route.set(function () {});
		} catch (error) {
			assert(error instanceof Error);
			ok = true;
		} finally {
			assert(ok);
		}
	},

	'Route.set(#string, value)': function () {
		var ok = false,
			route = new Route({}, /test/);

		/* Plain property */
		assert.equal(route.set('url', 'test'), route);
		assert.equal(route.url, 'test');
		assert.isUndefined(route.pattern);

		/* Objectified property */
		assert.equal(route.set('methods', 'GET'), route);
		assert.type(route.methods, 'object');
		assert(route.methods['GET']);
		assert.equal(Object.keys(route.methods).length, 1);

		/* Array */
		assert.equal(route.set('methods', ['HEAD', 'POST']), route);
		assert.type(route.methods, 'object');
		assert(route.methods['POST']);
		assert(route.methods['HEAD']);
		assert.equal(Object.keys(route.methods).length, 2);

		/* Objectified property undefined */
		assert.equal(route.set('methods', undefined), route);
		assert.isUndefined(route.methods);

		/* Plain property undefined */
		assert.equal(route.set('url', undefined), route);
		assert.isUndefined(route.url);
	},

	'Route.set(#string, #null)': function () {
		var ok = false,
			route = new Route({});

		try {
			route.set('url', null);
		} catch (error) {
			assert(error instanceof Error);
			ok = true;
		} finally {
			assert(ok);
		}

		route = new Route({});
		ok = false;

		try {
			route.set('pattern', null);
		} catch (error) {
			assert(error instanceof Error);
			ok = true;
		} finally {
			assert(ok);
		}
	},

	'Route.set(#object)': function () {
		var ok = false,
			route = new Route({});

		/* Url */
		assert.equal(route.set({ url: 'test' }), route);
		assert.equal(route.url, 'test');
		assert.isUndefined(route.pattern);

		/* Pattern */
		assert.equal(route.set({ pattern: /test/ }), route);
		assert(route.pattern.test('test'));
		assert.isUndefined(route.url);

		/* Plain property */
		assert.equal(route.set({ async: true }), route);
		assert(route.async);

		/* Objectified property */
		assert.equal(route.set({ methods: 'GET' }), route);
		assert.type(route.methods, 'object');
		assert(route.methods['GET']);
		assert.equal(Object.keys(route.methods).length, 1);

		/* Array */
		assert.equal(route.set({ methods: ['HEAD', 'POST'] }), route);
		assert.type(route.methods, 'object');
		assert(route.methods['POST']);
		assert(route.methods['HEAD']);
		assert.equal(Object.keys(route.methods).length, 2);

		/* Object */
		assert.equal(route.set({ methods: {'PUT': true, 'DELETE': true } }), route);
		assert.type(route.methods, 'object');
		assert(route.methods['PUT']);
		assert(route.methods['DELETE']);
		assert.equal(Object.keys(route.methods).length, 2);


		/* Wrong type for objectified */
		try {
			route.set({ methods: function () {} });
		} catch (error) {
			assert(error instanceof Error);
			ok = true;
		} finally {
			assert(ok);
		}

		ok = false;

		try {
			route.set({ methods: null });
		} catch (error) {
			assert(error instanceof Error);
			ok = true;
		} finally {
			assert(ok);
		}

		/* Objectified property undefined */
		assert.equal(route.set({ methods: undefined }), route);
		assert.isUndefined(route.methods);

		/* Plain property undefined */
		assert.equal(route.set({ url: undefined }), route);
		assert.isUndefined(route.url);
		assert.isUndefined(route.pattern);
	},

	'Route.unset(#string)': function () {
		var ok = false,
			route = new Route({}, 'test');

		assert.equal(route.unset('url'), route);
		assert.isUndefined(route.url);
		assert.isUndefined(route.pattern);

		route = new Route({}, /test/);
		assert.equal(route.unset('pattern'), route);
		assert.isUndefined(route.url);
		assert.isUndefined(route.pattern);

		route.set('async', true);
		assert.equal(route.unset('async'), route);
		assert.isUndefined(route.async);
		
	},

	'Route.unset(#array)': function () {
		var ok = false,
			route = new Route({}, 'test');

		route.set('url', 'test');
		route.set({ methods: ['GET', 'POST'], async: true });
		assert.equal(route.unset(['url', 'methods', 'pattern', 'async']), route);
		assert.isUndefined(route.url);
		assert.isUndefined(route.methods);
		assert.isUndefined(route.pattern);
		assert.isUndefined(route.async);
	},

	'Route.unset(#null)': function () {
		var ok = false,
			route = new Route({});

		try {
			route.unset(null);
		} catch (error) {
			assert(error instanceof Error);
			ok = true;
		} finally {
			assert(ok);
		}
	},

	'Route.unset(#undefined)': function () {
		var ok = false,
			route = new Route({});

		try {
			route.unset();
		} catch (error) {
			assert(error instanceof Error);
			ok = true;
		} finally {
			assert(ok);
		}
	},

	'Route.unset(#object)': function () {
		var ok = false,
			route = new Route({});

		try {
			route.unset({ 1: 'methods' });
		} catch (error) {
			assert(error instanceof Error);
			ok = true;
		} finally {
			assert(ok);
		}
	},

	'Route.match(#null)': function () {
		var ok = false,
			route = new Route({});

		try {
			route.match(null);
		} catch (error) {
			assert(error instanceof Error);
			ok = true;
		} finally {
			assert(ok);
		}
	},

	'Route.match(#empty)': function () {
		var route = new Route({});

		/* Empty route always matches */
		assert(route.match({}));
		assert(route.match({ method: 'HEAD' }));
		assert(route.match({ host: 'localhost' }));
	},

	'Route.match(#methods)': function () {
		var route = new Route({}).set({
				methods: ['GET', 'POST']
			});

		assert(route.match({ method: 'GET' }));
		assert(route.match({ method: 'POST' }));
		assert(!route.match({}));
		assert(!route.match({ method: 'HEAD' }));
		assert(!route.match({ host: 'localhost' }));
	},

	'Route.match(#hosts)': function () {
		var route = new Route({}).set({
				hosts: ['microsoft.com', 'apple.com', 'kernel.org']
			});

		assert(route.match({ host: 'microsoft.com' }));
		assert(route.match({ host: 'apple.com' }));
		assert(route.match({ host: 'kernel.org' }));
		assert(!route.match({}));
		assert(!route.match({ method: 'HEAD' }));
		assert(!route.match({ host: 'localhost' }));
	},

	'Route.match(#pattern)': function () {
		var route = new Route({}).set({
				pattern: /\/test\/(123|456)\/ok/,
				capture: { '$1' : 'number' }
			}),
			context = { url: '/test/123/ok' };

		assert(route.match({ url: '/test/123/ok' }));
		assert(route.match({ url: '/test/456/ok' }));
		assert(route.match({ url: '/test/456/ok', method: 'GET' }));
		assert(!route.match({}));
		assert(!route.match({ url: '/test/13/ok' }));
		assert(!route.match({ url: 'test/456/ok' }));
		assert(!route.match({ host: 'localhost' }));

		assert(route.match(context));
		assert.type(context.params, 'object');
		assert.equal(context.params.number, '123');

		context = { url: '/test/456/ok' };

		assert.equal(route.set('capture', { '$1' : 'test' }), route);
		assert(route.match(context));
		assert.equal(context.params.test, '456');
		assert.isUndefined(context.params.number);
	},

	'Route.match(#types)': function () {
		var route = new Route({}).set({
				types: ['text/html', 'text/text']
			});

		assert(route.match({ types: ['text/html'] }));
		assert(route.match({ types: ['text/text'] }));
		assert(route.match({ types: ['html/html', 'text/text'] }));
		assert(route.match({ types: ['text/text', 'html/html'] }));
		assert(route.match({ types: ['text/text', 'text/html'] }));

		assert(!route.match({}));
		assert(!route.match({ types: [] }));
		assert(!route.match({ types: ['application/json'] }));
		assert(!route.match({ types: ['application/json', 'html/html'] }));
	},

	'Route.copy(#full)': function () {
		var route = new Route({}).set({
				url: 'test',
				methods: ['GET', 'POST'],
				hosts: ['apple.com', 'microsoft.com'],
				async: true
			}),
			copy = route.copy();

		assert(copy instanceof Route);
		assert.notEqual(copy, route);
		assert(!copy.types);
		assert(!copy.capture);
		assert(!copy.pattern);
		assert.equal(copy.url, route.url);
		assert.equal(copy.pattern, route.pattern);
		assert.equal(copy.async, route.async);
		assert.equal(copy.pattern, route.pattern);
		assert.equal(copy.capture, route.capture);
		assert.equal(copy.types, route.types);
		assert.eql(copy.methods, route.methods);
		assert.eql(copy.hosts, route.hosts);
	},

	'Route.copy(#empty)': function () {
		var route = new Route({}),
			copy = route.copy(),
			fields = ['methods', 'hosts', 'types', 'async', 'url', 'pattern', 'capture'],
			i, l; 

		assert(copy instanceof Route);
		assert.notEqual(copy, route);

		for (i = 0, l = fields.length; i < l; i++) {
			assert.equal(copy[fields[i]], route[fields[i]]);
			assert(!copy[fields[i]]);
			assert(!route[fields[i]]);
		}
	}
};

