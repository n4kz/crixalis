'use strict';

/**
 * Less plugin for Crixalis. Depends on static and processor plugins.
 * Provides simple wrapper around [Less](http://lesscss.org) css preprocessor.
 * @module Crixalis
 * @submodule less
 * @for Controller
 */

var Crixalis = require('crixalis'),
	Parser   = require('less').Parser,
	cache    = {};

module.exports = function (options) {

	/**
	 * Compile css using less and send it to client
	 * @method less
	 * @param {String} filename Path to less source file
	 * @chainable
	 */
	Crixalis.prototype.plugin('./plugins/processor', {
		method    : 'less',
		extension : 'css',
		compile   : function (filename, data, options) {
			options.filename = filename;
			options.async    = true;

			var parser = new Parser(options),
				that   = this;

			parser.parse(data, function (error, result) {
				if (!error && result) {
					try {
						result = result.toCSS();
					} catch (exception) {
						error = exception;
					}
				}

				/* Less parser throws exceptions that are not Error instances */
				if (error && !(error instanceof Error)) {
					error = new Error([error.message, error.filename].join(' '));
				}

				that.forward(error, result);
			});
		}
	});
};
