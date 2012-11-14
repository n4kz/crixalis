'use strict';

/**
 * Jade plugin for Crixalis.
 * Provides simple wrapper around [Jade](http://jade-lang.com) template engine.
 * @module Crixalis
 * @submodule jade
 * @extensionfor Context
 */

var Crixalis = require('crixalis'),
	jade = require('jade'),
	fs = require('fs'),
	cache = {};

module.exports = function (options) {
	/**
	 * Render Jade template. Template parameters are taken from this.stash.
	 *
	 *     c.router('/')
	 *         .to(function () {
	 *             this.jade('./templates/index.jade');
	 *         });
	 *
	 * @method jade
	 * @param {String} template Path to Jade template
	 * @chainable
	 */
	Crixalis._('jade', function (template) {
		if (typeof template !== 'string') {
			throw new Error('Template expected to be string');
		}

		this.async = true;

		fs.lstat(template, function (error, result) {
			var cached = cache[template],
				mtime;

			if (error) {
				/* File not found */
				this.emit('error', error);
				return;
			} else {
				mtime = +result.mtime;
			}

			/* Best case, template is already compiled */
			if (cached && cached.mtime === mtime) {
				this.view = 'html';
				this.body = cached(this.stash);

				this.emit('end');
				return;
			}

			/* No cached template, read from disk */
			fs.readFile(template, function (error, result) {
				if (error) {
					/* File not found or is not readable */
					this.emit('error', error);
					return;
				}

				try {
					cached = jade.compile(result, options);
					this.body = cached(this.stash);
				} catch (error) {
					/* Compilation failed */
					this.emit('error', error);
					return;
				}

				cached.mtime = mtime;
				cache[template] = cached;

				this.view = 'html';
				this.emit('end');
			}.bind(this));
		}.bind(this));

		return this;
	});
};
