'use strict';

/**
 * Request plugin. Provides thin wrapper
 * around http.request and https.request methods
 *
 *     var that = this;
 *
 *     this.request({
 *         ssl      : true,
 *         hostname : 'example.com',
 *         path     : '/test',
 *         type     : 'json',
 *         data     : {
 *             id : 243
 *         }
 *     }, function (error, response) {
 *         console.dir(response.headers);
 *         console.log(response.statusCode);
 *         console.log(response.body);
 *     });
 *
 * @module Crixalis
 * @submodule request
 * @for Controller
 */

var Crixalis = require('../controller'),
	http     = require('http'),
	https    = require('https'),
	qs       = require('querystring');

module.exports = function () {
	/**
	 * Do HTTP request
	 * @method request
	 * @param {Object} options
	 * @param {Function} callback
	 * @async
	 * @chainable
	 */
	Crixalis.define('method', 'request', function (options, callback) {
		var request, data;

		options.method = String(options.method || 'GET')
			.toUpperCase();

		/* Add some headers */
		if (options.data) {
			switch (options.method) {
				/* No body allowed, replace query string with data */
				case 'GET':
				case 'HEAD':
					options.path = String(options.path || '/')
						.replace(/(?:\?.*)?$/, '?' + qs.stringify(options.data));
					break;

				/* Prepare message body */
				default:
					options.headers = Object(options.headers);

					switch (options.type || 'form') {
						case 'json':
							options.headers['content-type'] = 'application/json';
							data = JSON.stringify(options.data);
							break;

						case 'form':
							options.headers['content-type'] = 'application/x-www-form-urlencoded';
							data = qs.stringify(options.data);
							break;

						default:
							throw new Error('Unsupported type ' + options.type);
					}

					options.headers['content-length'] = Buffer.byteLength(data);
			}
		}

		/* Prepare request */
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

		/* Write data */
		if (data) {
			request.write(data);
		}

		request.end();

		return this;
	});
};
