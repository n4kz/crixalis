'use strict';

/**
 * Shortcuts plugin
 * Provides syntactic sugar for route definition
 *
 *     Crixalis
 *         .plugin('shortcuts')
 *         .get('/api/info', { types: ['application/json'] }, function () {
 *             ...
 *         })
 *         .post('/signin', function () {
 *         });
 *
 * @module Crixalis
 * @submodule shortcuts
 * @for Crixalis
 */

module.exports = function (methods) {
	var Crixalis = this;

	if (null == methods) {
		methods = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'];
	}

	if (!Array.isArray(methods)) {
		throw new Error('Array expected');
	}

	methods.forEach(function (method) {
		if (typeof method !== 'string') {
			throw new Error('Expected method name to be string');
		}

		Crixalis.define('method', method.toLowerCase(), function (source, options, callback) {
			if (arguments.length == 2) {
				callback = options;
				options  = {};
			}

			options.methods = [method.toUpperCase()];

			return this.route(source, options, callback);
		});
	});
};
