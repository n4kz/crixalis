'use strict';

/**
 * Coffee plugin for Crixalis. Depends on static plugin.
 * Provides simple wrapper around [Coffee](http://coffeescript.org) language.
 * @module Crixalis
 * @submodule coffee
 * @extensionfor Context
 */

var Crixalis = require('crixalis'),
	coffee   = require('coffee-script'),
	crypto   = require('crypto'),
	fs       = require('fs'),
	cache    = {};

module.exports = function (options) {
	/**
	 * Compile coffeescript and send it to client
	 * @method coffee
	 * @param {String} script Path to coffee script source file
	 * @chainable
	 */
	Crixalis._('coffee', function (script) {
		var that = this;

		if (typeof script !== 'string') {
			throw new Error('Script expected to be string');
		}

		fs.lstat(script, function (error, result) {
			var cached = cache[script],
				mtime, file;

			if (error) {
				/* File not found */
				that.emit('default');
				return;
			}

			mtime = +result.mtime;

			/* Best case, script is already compiled */
			if (cached && cached.disk && cached.mtime === mtime) {
				/* Serve compiled file */
				that.serve(cached.path, onError);

				return;
			}

			/* Create cache object and fill it with data */
			if (!cached) {
				cached       = cache[script] = {};
				cached.file  = crypto.createHash('md5').update(script).digest('hex');
				cached.path  = that.cacheDirectory + cached.file + '.js';
				cached.mtime = mtime,
				cached.disk  = false;
			}

			/* Try to find compiled file */
			fs.lstat(cached.path, function (error, result) {
				if (!error && mtime < +result.mtime) {
					cached.disk = true;
					that.serve(cached.path, onError);
					return;
				}

				/* No cache, read from disk */
				fs.readFile(script, function (error, data) {
					var data;

					if (error) {
						/* File not found */
						that.emit('default');
						return;
					}

					try {
						data = coffee.compile(data.toString());
					} catch (error) {
						/* Compilation failed */
						console.warn(error);
						onError.call(that, error);
						return;
					}

					/* Write compiled file to disk */
					fs.writeFile(cached.path, data, function (error) {
						if (error) {
							onError.call(that, error);
							return;
						}

						cached.disk = true;
						that.serve(cached.path, onError);
					});
				});
			});
		});

		return this;
	});

	Crixalis.prototype._views.javascript = function () {
		this.headers['Content-Type'] = 'application/javascript';
	};
};

function onError (error) {
	this.emit('error', error);
}
