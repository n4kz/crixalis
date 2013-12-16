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
 *         type     : 'form', // 'json', 'custom'
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
	stream   = require('stream'),
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

		/* Request method */
		options.method = String(options.method || 'GET')
			.toUpperCase();

		/* Request type */
		options.type = String(options.type || 'form')
			.toLowerCase();

		/* Request headers */
		options.headers = Object(options.headers);

		/* Request data */
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
					switch (options.type) {
						case 'json':
							data = JSON.stringify(options.data);
							options.headers['content-type']   = 'application/json';
							options.headers['content-length'] = Buffer.byteLength(data);
							break;

						case 'form':
							data = qs.stringify(options.data);
							options.headers['content-type']   = 'application/x-www-form-urlencoded';
							options.headers['content-length'] = Buffer.byteLength(data);
							break;

						case 'custom':
							data = options.data;
							break;

						default:
							throw new Error('Unsupported type ' + options.type);
					}
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

		/* Catch errors */
		request.on('error', callback);

		/* Write data */
		if (data) {
			/* Handle streams */
			if (data instanceof stream.Readable || data instanceof stream.Duplex) {
				data.pipe(request);
				return this;
			}

			request.write(data);
		}

		/* End request */
		request.end();

		return this;
	});
};
