'use strict';

/**
 * Less plugin for Crixalis. Depends on static and processor plugins.
 * Provides simple wrapper around [Less](http://lesscss.org) css preprocessor.
 * @module Crixalis
 * @submodule less
 * @extensionfor Context
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
				if (error) {
					throw error;
				}

				that.forward(undefined, result.toCSS());
			});
		}
	});
};
