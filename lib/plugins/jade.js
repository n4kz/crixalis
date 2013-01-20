'use strict';

/**
 * Jade plugin for Crixalis.
 * Provides simple wrapper around [Jade](http://jade-lang.com) template engine.
 * @module Crixalis
 * @submodule jade
 * @for Controller
 */

var Crixalis = require('crixalis').self,
	jade     = require('jade'),
	fs       = require('fs'),
	cache    = {};

module.exports = function (options) {
	options = options || {};

	/**
	 * Templates parent directory
	 * @property jadePath
	 * @type String
	 * @default .
	 */
	Crixalis._('jadePath', '.');

	/**
	 * Render Jade template. Template parameters are taken from this.stash.
	 *
	 *     c.jadePath = './templates';
	 *
	 *     c.router('/')
	 *         .to(function () {
	 *             this.jade('index.jade');
	 *         });
	 *
	 * @method jade
	 * @param {String} template Path to Jade template
	 * @chainable
	 */
	Crixalis._('jade', function (template) {
		var that = this;

		if (typeof template !== 'string') {
			throw new Error('Template expected to be string');
		}

		if (this.jadePath) {
			template = this.jadePath + '/' + template;
		}

		fs.lstat(template, function (error, result) {
			var cached = cache[template],
				mtime;

			if (error) {
				/* File not found */
				that.emit('error', error);
				return;
			}

			mtime = +result.mtime;

			/* Best case, template is already compiled */
			if (cached && cached.mtime === mtime) {
				that.view = 'html';
				that.body = cached(that.stash);
				that.render();
				return;
			}

			/* No cached template, read from disk */
			fs.readFile(template, function (error, result) {
				if (error) {
					/* File not found or is not readable */
					that.emit('error', error);
					return;
				}

				/* Jade needs filename for includes and error reporting */
				options.filename = template;

				try {
					cached = jade.compile(result, options);
					that.body = cached(that.stash);
				} catch (error) {
					/* Compilation failed */
					that.emit('error', error);
					return;
				}

				cached.mtime = mtime;
				cache[template] = cached;

				that.view = 'html';
				that.render();
			});
		});

		return this;
	});
};
