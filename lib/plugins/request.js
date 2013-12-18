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
 *         type     : 'form', // 'json', 'form-data', 'custom'
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
	crypto   = require('crypto'),
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

		if (this.signature) {
			options.headers['X-Requested-With'] = this.signature;
		}

		/* Request data */
		if (options.data) {
			switch (options.method) {
				/* Replace query string with data */
				case 'GET':
				case 'HEAD':
				case 'DELETE':
					options.path = String(options.path || '/')
						.replace(/(?:\?.*)?$/, '?' + qs.stringify(options.data));
					break;

				/* Prepare message body */
				default:
					switch (options.type) {
						case 'json':
							data = JSON.stringify(options.data);
							options.headers['Content-Type']   = 'application/json';
							options.headers['Content-Length'] = Buffer.byteLength(data);
							break;

						case 'form':
							data = qs.stringify(options.data);
							options.headers['Content-Type']   = 'application/x-www-form-urlencoded';
							options.headers['Content-Length'] = Buffer.byteLength(data);
							break;

						case 'form-data':
							var key, boundary;

							boundary = crypto.createHash('md5')
								.update([Date.now(), Math.random()].join(''))
								.digest('hex');

							data = '';

							for (key in options.data) {
								if (options.data.hasOwnProperty(key)) {
									data += '--' + boundary + '\r\n';
									data += 'Content-Disposition: form-data; name="' + key + '"\r\n\r\n';
									data += options.data[key];
									data += '\r\n';
								}
							}

							data += '--' + boundary + '--\r\n';

							options.headers['Content-Type']   = 'multipart/form-data; boundary=' + boundary;
							options.headers['Content-Length'] = Buffer.byteLength(data);
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
