'use strict';

/**
 * Request plugin. Provides thin wrapper
 * around http.request and https.request methods
 * @module Crixalis
 * @submodule request
 * @for Controller
 */

var Crixalis = require('../controller').self,
	http     = require('http'),
	https    = require('https');

module.exports = function () {
	/**
	 * Do HTTP request
	 * @method request
	 * @param {Object} options
	 * @param {Function} callback
	 * @async
	 * @chainable
	 */
	Crixalis._('request', function (options, callback) {
		var request;

		if (options.data) {
			options.headers = options.headers || {};

			/* Add some headers */
			options.headers['content-type']   = options.headers['content-type'] || 'application/x-www-form-urlencoded';
			options.headers['content-length'] = Buffer.byteLength(options.data);
		}

		request = (options.ssl? https : http).request(options, function (response) {
			response.body = '';

			response
				.on('error', callback)
				.on('data', function (chunk) {
					this.body += chunk;
				})
				.on('end', function () {
					callback(null, this);
				});
		});

		if (options.data) {
			/* Write data */
			request.write(options.data);
		}

		request.end();

		return this;
	});
};
