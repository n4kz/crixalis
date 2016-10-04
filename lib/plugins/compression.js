'use strict';

/**
 * Compression plugin
 * Provides gzip and deflate on the fly compression for response
 * @module Crixalis
 * @submodule compression
 * @for Crixalis
 */

module.exports = function () {
	var zlib = require('zlib');

	/**
	 * Default compression method. Supported values are __gzip__ and __deflate__
	 * @property defaultCompression
	 * @type String
	 * @default gzip
	 */
	this.define('defaultCompression', 'gzip', { writable: true });

	/**
	 * Detect best supported by client compression format
	 * @method compression
	 * @return {String}
	 */
	this.define('compression', function () {
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
	});

	/**
	 * Apply compression to response body
	 * @event compression
	 */
	this.on('compression', function () {
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
				/* Compression is not supported by client or disabled for this request */
				process.nextTick(function () {
					that.sendResponse();
				});
				return;
		}

		compressor.on('error', function (error) {
			that.error(error);
		});

		compressor.on('data', function (chunk) {
			length += chunk.length;
			buffers.push(chunk);
		});

		compressor.on('end', function () {
			compressor.removeAllListeners();

			/* Set headers */
			that.headers['Content-Length']   = length;
			that.headers['Content-Encoding'] = type;
			that.headers['Vary']             = 'Accept-Encoding';

			/* Create response body */
			that.body = Buffer.concat(buffers, length);

			/* Respond to client */
			that.sendResponse();
		});

		compressor.write(this.body);
		compressor.end();
	});
};
