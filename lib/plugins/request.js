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
							var key, boundary, headers, header;

							boundary = crypto.createHash('md5')
								.update([Date.now(), Math.random()].join(''))
								.digest('hex');

							headers = Object(options.dataHeaders);

							data = '';

							for (key in options.data) {
								data += '--' + boundary + '\r\n';
								data += 'Content-Disposition: form-data; name="' + key + '"';

								/* TODO: filename in content-disposition */

								for (header in headers[key]) {
									data += '\r\n';
									data += header + ': ' + headers[key][header];
								}

								data += '\r\n\r\n';
								data += options.data[key];
								data += '\r\n';
							}

							data += '--' + boundary + '--';
							data += '\r\n';

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
			var length = 0,
				body   = [];

			/* Set response encoding */
			if (options.encoding) {
				response.setEncoding(options.encoding);
			}

			response
				.on('error', callback)
				.on('data', function (chunk) {
					body.push(chunk);
					length += chunk.length;
				})
				.on('end', function () {
					this.message = Buffer.concat(body, length);

					/* XXX: Deprecated */
					this.body = this.message.toString();

					callback(null, this);
				});
		});

		/* Set timeout */
		if (options.timeout) {
			request.setTimeout(options.timeout, function () {
				/* Terminate request */
				request.removeAllListeners();
				request.on('error', function () { /* dummy */ });
				request.abort();

				/* Return error */
				callback(new Error('Request timed out'));
			});
		}

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
