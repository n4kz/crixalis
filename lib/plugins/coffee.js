'use strict';

/**
 * Coffee plugin for Crixalis. Depends on static and processor plugins.
 * Provides simple wrapper around [Coffee](http://coffeescript.org) language.
 * @module Crixalis
 * @submodule coffee
 * @for Controller
 */

var Crixalis = require('../controller'),
	coffee   = require('coffee-script'),
	cache    = {};

module.exports = function () {

	/**
	 * Compile coffeescript and send it to client
	 * @method coffee
	 * @param {String} script Path to coffee script source file
	 * @chainable
	 */
	Crixalis.plugin('processor', {
		method    : 'coffee',
		extension : 'js',
		compile   : function (filename, data, options) {
			return coffee.compile(data);
		}
	});
};
