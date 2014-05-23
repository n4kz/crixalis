'use strict';

/**
 * Access log plugin
 * Provides basic request logging with console output
 * @module Crixalis
 * @submodule access
 * @for Controller
 */

var strftime = require('strftime'),
	sprintf  = require('sprintf').sprintf;

function colorize (string, color) {
	return '\u001b[' + color + 'm' + string + '\u001b[39m';
}

module.exports = function (options) {
	options = Object(options);

	/* Check stdout descriptor type */
	if (!options.hasOwnProperty('color')) {
		options.color = require('tty').isatty(1);
	}

	/* CLF: '%h [%{%d/%b/%Y:%T %z}t] "%m %Uq %H" %s %b' */
	options.format = options.format || '%T [%t] %s %-4m %h %U%q';

	this.on('destroy', function () {
		var time = Date.now() - this.start,
			code = String(this.code || 200),
			that = this,
			args, string;

		/* Colorize code */
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

		/* TODO: Case insensitive headers */

		/* Prepare log data */
		args = {
			'%%': '%',
			'%b': this.headers['Content-Length'] || 0,
			'%B': this.headers['Content-Length'] || '-',
			'%h': this.address,
			'%m': this.method,
			'%U': this.req.url.replace(/\?.*$/, ''),
			'%q': this.req.url.replace(/^[^?]+/, ''),
			'%H': 'HTTP/' + this.req.httpVersion,
			'%p': this.port,
			'%P': process.pid,
			'%T': sprintf('%1.3f', time / 1000),
			'%D': time,
			'%s': code,
			'%t': function (format) { return strftime(format || '%d/%b/%Y %T %z', new Date(that.start)) },
			'%C': function (cookie) { return that.cookies[cookie]     || '-' },
			'%i': function (header) { return that.req.headers[header] || '-' },
			'%o': function (header) { return that.headers[header]     || '-' }
		};

		/* Format log string */
		string = options.format.replace(/%(-?\d*)(?:\{(.*?)})?([\w%])/g, function (match, padding, meta, key) {
			var value = args['%' + key];

			if (typeof value === 'function') {
				value = value(meta);
			}

			return sprintf('%' + padding + 's', null == value? '' : value);
		});

		console.log(string);
	});
};
