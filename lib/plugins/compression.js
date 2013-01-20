'use strict';

/**
 * Compression plugin.
 * Provides gzip and deflate on the fly compression for response
 * @module Crixalis
 * @submodule compression
 * @for Controller
 */

var Crixalis = require('crixalis').self,
	zlib     = require('zlib');

module.exports = function () {
	Crixalis
		/**
		 * Default compression method. Supported values are __gzip__ and __deflate__.
		 * @property defaultCompression
		 * @type String
		 * @default gzip
		 */
		._('defaultCompression', 'gzip')

		/**
		 * Detect best supported by client compression format
		 * @method compression
		 * @return {String}
		 */
		._('compression', function () {
			var codings = this.codings,
				i, l;

			/* Select compression type */
			for (i = 0, l = codings.length; i < l; i++) {
				switch (codings[i]) {
					case '*':
						return this.defaultCompression;

					case 'gzip':
						return 'gzip';

					case 'deflate':
						return 'deflate';
				}
			}

			/* Nothing selected */
			return undefined;
		})

		/**
		 * Apply compression to response body
		 * @event compression
		 */
		.$('compression', function () {
			var that    = this,
				type    = this.compression(),
				length  = 0,
				buffers = [],
				compressor;

			switch (type) {
				case 'gzip':
					compressor = zlib.createGzip();
					break;

				case 'deflate':
					compressor = zlib.createDeflate();
					break;

				default:
					/* Compression not supported by client or disabled for this request */
					this._response();
					return;
			}

			compressor.on('error', function (error) {
				that.emit('error', error);
			});

			compressor.on('data', function (chunk) {
				length += chunk.length;
				buffers.push(chunk);
			});

			compressor.on('end', function () {
				var output, b, i, j, l, k;

				compressor.removeAllListeners();

				switch (buffers.length) {
					case 0:
						output = new Buffer(0);
						break;

					case 1:
						output = buffers[0];
						break;

					default:
						output = new Buffer(length);

						for (i = 0, j = 0, l = buffers.length; i < l; i++) {
							b = buffers[i];
							k = b.length;
							b.copy(output, j, 0, k);
							j += k;
						}
				}

				/* Set headers */
				that.headers['Content-Length']   = length;
				that.headers['Content-Encoding'] = type;
				that.headers['Vary']             = 'Accept-Encoding';

				that.body = output;

				/* Respond to client */
				that._response();
			});

			compressor.write(this.body);
			compressor.end();
		});
};
