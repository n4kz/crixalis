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
		var that = this;

		if (typeof template !== 'string') {
			throw new Error('Template expected to be string');
		}

		this.async = true;

		/* Best case, template is already compiled */
		if (cache.hasOwnProperty(template)) {
			this.view = 'html';
			this.body = cache[template].call(undefined, this.stash);

			this.emit('end');
			return this;
		}

		/* No cached template, read from disk */
		fs.readFile(template, function (error, data) {
			if (error) {
				/* File not found */
				that.emit('error', error);
				return;
			}

			try {
				that.body = (
					cache[template] = jade.compile(data, options)
				).call(undefined, that.stash);
			} catch (error) {
				/* Compilation failed */
				that.emit('error', error);
				return;
			}

			that.view = 'html';
			that.emit('end');
		});

		return this;
	});
};
