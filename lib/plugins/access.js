'use strict';

/**
 * Access log plugin
 * Provides basic request logging with console output
 * @module Crixalis
 * @submodule access
 * @for Controller
 */

var sprintf = require('sprintf').sprintf;

module.exports = function () {
	this.on('destroy', function () {
		var time = (Date.now() - this.start) / 1000,
			code = this.code || 200;

		console.log(sprintf(
			"%1.3f %-4s %3u %15s %s",
			time, this.method, code, this.address, this.req.url)
		);
	});
};
