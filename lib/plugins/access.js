'use strict';

/**
 * Access log plugin
 * Provides configurable request logging
 * @module Crixalis
 * @submodule access
 * @for Controller
 */

var Crixalis = require('../controller'),
	strftime = require('strftime'),
	sprintf  = require('sprintf').sprintf;

module.exports = function (options) {
	options = Object(options);

	var method = options.method || 'info',
		logger = options.logger || Crixalis.logger;

	/* CLF: '%h [%{%d/%b/%Y:%T %z}t] "%m %Uq %H" %s %b' */
	options.format = options.format || '%T [%t] %s %-4m %h %U%q';

	Crixalis.on('destroy', function () {
		var time = Date.now() - this.start,
			code = String(this.code || 200),
			that = this,
			args, string;

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
		string = options.format.replace(/%(-?\d*)(?:\{(.*?)\})?([\w%])/g, function (match, padding, meta, key) {
			var value = args['%' + key];

			if (typeof value === 'function') {
				value = value(meta);
			}

			return sprintf('%' + padding + 's', null == value? '' : value);
		});

		/* Send to logger */
		if (typeof logger[method] === 'function') {
			logger[method](string);
		}
	});
};
