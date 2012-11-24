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
	 * @param {String} script Path to coffee script file
	 * @chainable
	 */
	Crixalis._('coffee', function (script) {
		var that = this;

		if (typeof script !== 'string') {
			throw new Error('Script expected to be string');
		}

		fs.lstat(script, function (error, result) {
			var cached = cache[script],
				mtime;

			if (error) {
				/* File not found */
				that.emit('default');
				return;
			}

			mtime = +result.mtime;

			/* Best case, script is already compiled */
			/* TODO: check for compiled file if cache is empty */
			if (cached && cached.mtime === mtime) {
				if (cached.disk) {
					/* Serve compiled file */
					that.serve(cached.path, function (error) {
						that.emit('error', error);
					});
				} else {
					/* No compiled file present, try to serve from process cache */
					that.view = 'javascript';
					that.body = cached.data;
					that.emit('end');
				}

				return;
			}

			/* No cache, read from disk */
			fs.readFile(script, function (error, data) {
				var file   = crypto.createHash('md5').update(script).digest('hex'),
					cached = {
						path  : that.cacheDirectory + file + '.js',
						mtime : mtime,
						disk  : false
					}, stream;

				if (error) {
					/* File not found */
					that.emit('default');
					return;
				}

				try {
					cached.data = coffee.compile(data.toString());
				} catch (error) {
					/* Compilation failed */
					that.emit('error', error);
					return;
				}

				cache[script] = cached;

				/* Write compiled file to disk */
				fs.writeFile(cached.path, cached.data, function (error) {
					if (error) {
						console.warn(error);
						that.emit('error', error);
					}

					/* Free memory */
					delete cached.data;
					cached.disk = true;

					that.serve(cached.path, function (error) {
						that.emit('error', error);
					});
				});
			});
		});

		return this;
	});

	Crixalis.prototype._views.javascript = function () {
		this.headers['Content-Type'] = 'application/javascript';
	}
};
