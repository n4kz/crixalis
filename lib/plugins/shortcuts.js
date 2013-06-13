'use strict';

/**
 * Shortcuts plugin.
 * Provides syntactic sugar for router.
 *
 *     Crixalis
 *         .plugin('shortcuts', ['get', 'post']);
 *         .router()
 *             .get('/api/info', function () {
 *                 ...
 *             })
 *
 *             .from(/^\/pub\/(.*)$/)
 *             .via('GET', 'HEAD')
 *             .to(function () {
 *                 ...
 *             })
 *
 *             .from('/signin')
 *             .post()
 *             .to(signin);
 *
 * @module Crixalis
 * @submodule shortcuts
 * @for Controller
 */

module.exports = function (methods) {
	var Route = this.router().constructor.prototype;

	if (null == methods) {
		methods = ['GET', 'POST', 'HEAD', 'PUT', 'DELETE'];
	}

	if (!Array.isArray(methods)) {
		throw new Error('Array expected');
	}

	Route.via = function () {
		var argv = [].slice.call(arguments);

		if (!argv.length) {
			throw new Error('Method expected');
		}

		if (Array.isArray(argv[0])) {
			if (argv.length > 1) {
				throw new Error('Unexpected arguments');
			}

			argv = argv[0];

			if (!argv.length) {
				argv = undefined;
			}
		}

		this.set('methods', argv);

		return this;
	};

	methods.forEach(function (method) {
		method = String(method).toLowerCase();

		Route[method] = function (options, callback) {
			var argv = [].slice.call(arguments);

			/* Get route source */
			switch (typeof argv[0]) {
				case 'object':
					if (!(argv[0] instanceof RegExp)) {
						break;
					}
				case 'string':
					this.from(argv.shift());
					break;
			}

			/* Get route options */
			if (typeof argv[0] === 'object') {
				this.set(argv.shift());
			}

			/* Set route method */
			this.via(method.toUpperCase());

			/* Set route destination */
			if (typeof argv[0] === 'function') {
				this.to(argv.shift());
			}

			/* Check trailing arguments */
			if (argv.length) {
				throw new Error('Unexpected arguments');
			}

			return this;
		};
	});
};
