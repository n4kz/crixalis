'use strict';

/**
 * Jade plugin for Crixalis.
 * Provides simple wrapper around [Jade](http://jade-lang.com) template engine.
 * @module Crixalis
 * @submodule jade
 * @for Controller
 */

var define = require('../controller').define,
	jade   = require('jade'),
	fs     = require('fs'),
	cache  = {};

module.exports = function (options) {
	options = Object(options);

	/**
	 * Templates parent directory
	 * @property jadePath
	 * @type String
	 * @default .
	 */
	define('property', 'jadePath', '.');

	/**
	 * Render Jade template. Template parameters are taken from this.stash.
	 *
	 *     c.jadePath = './templates';
	 *
	 *     c.route('/', function () {
	 *         this.jade('index.jade');
	 *     });
	 *
	 * @method jade
	 * @param {String} template Path to Jade template
	 * @chainable
	 */
	define('method', 'jade', function (template) {
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
				that.error(error, true);
				return;
			}

			mtime = +result.mtime;

			/* Best case, template is already compiled */
			if (cached && cached.mtime === mtime) {
				that.body = cached(that.stash);
				that.render('html');
				return;
			}

			/* No cached template, read from disk */
			fs.readFile(template, function (error, result) {
				if (error) {
					/* File not found or is not readable */
					that.error(error, true);
					return;
				}

				/* Jade needs filename for includes and error reporting */
				options.filename = template;

				try {
					cached = jade.compile(result, options);
					that.body = cached(that.stash);
				} catch (error) {
					/* Compilation failed */
					that.error(error, true);
					return;
				}

				cached.mtime = mtime;
				cache[template] = cached;

				that.render('html');
			});
		});

		return this;
	});
};
