'use strict';

/**
 * Access log plugin
 * Provides basic request logging with console output
 * @module Crixalis
 * @submodule access
 * @for Controller
 */

var sprintf = require('sprintf').sprintf;

function colorize (string, color) {
	return '\u001b[' + color + 'm' + string + '\u001b[39m';
}

module.exports = function (options) {
	options = Object(options);

	/* Check stdout descriptor type */
	if (!options.hasOwnProperty('color')) {
		options.color = require('tty').isatty(1);
	}

	this.on('destroy', function () {
		var time = (Date.now() - this.start) / 1000,
			code = String(this.code || 200);

		if (!(options.color === false)) {
			switch (code[0]) {
				case '1':
				case '2':
					/* Green */
					code = colorize(code, 32);
					break;

				case '3':
					/* Yellow */
					code = colorize(code, 33);
					break;

				case '4':
				case '5':
					/* Red */
					code = colorize(code, 31);
					break;
			}
		}

		console.log(sprintf(
			"%1.3f %s %-4s %s %s",
			time, code, this.method, this.address, this.req.url)
		);
	});
};
