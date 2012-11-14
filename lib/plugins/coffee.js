'use strict';

/*
 * Coffeescript plugin
 * For this moment end signal is called twice
 * That's ok in most cases
 */

var Crixalis = require('crixalis'),
	coffee = require('coffee-script'),
	fs = require('fs'),
	cache = {};

module.exports = function (options) {
	/**
	 * Render coffeescript template
	 * @method coffee
	 * @param {String} template Path to template
	 * @chainable
	 */
	Crixalis._('coffee', function (template) {
		var that = this;

		if (typeof template !== 'string') {
			throw new Error('Template expected to be string');
		}

		/* Best case, template is already compiled */
		if (cache.hasOwnProperty(template)) {
			this.view = 'javascript';
			this.body = cache[template];

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
				that.body = cache[template] = coffee.compile(data.toString(), options);
			} catch (error) {
				/* Compilation failed */
				that.body = error.toString()
				that.view = 'html'
				that.emit('error', error);
				return;
			}

			that.view = 'javascript';
			that.emit('end');
		});

		return this;
	});
};

