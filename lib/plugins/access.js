'use strict';

/**
 * Access log plugin
 * Provides configurable request logging
 * @module Crixalis
 * @submodule access
 * @for Crixalis
 */

var strftime = require('strftime'),
	sprintf  = require('sprintf').sprintf;

function find (object, target) {
	var key;

	if (typeof target !== 'string') {
		return;
	}

	target = target.toLowerCase();

	for (key in object) {
		if (key.toLowerCase() === target) {
			return object[key];
		}
	}
}

function findByPath (object, path) {
	if (typeof path !== 'string') {
		return;
	}

	path = path.split('.');

	while (path.length) {
		if (null == object) {
			return;
		}

		object = object[path.shift()];
	}

	return object;
}

module.exports = function (options) {
	options = Object(options);

	var method = options.method || 'info',
		logger = options.logger || this.logger;

	/* CLF: '%h [%{%d/%b/%Y:%T %z}t] "%m %Uq %H" %s %b' */
	options.format = options.format || '%T [%t] %s %-4m %h %U%q';

	this.on('destroy', function () {
		var time = Date.now() - this.stamp,
			that = this,
			args, string;

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
			'%s': this.code || 200,
			'%P': process.pid,
			'%T': sprintf('%1.3f', time / 1000),
			'%D': time,
			'%t': function (format) { return strftime(format || '%d/%b/%Y %T %z', new Date(that.stamp)) },
			'%C': function (cookie) { return find(that.cookies, cookie)     || '-' },
			'%i': function (header) { return find(that.req.headers, header) || '-' },
			'%o': function (header) { return find(that.headers, header)     || '-' },
			'%S': function (path)   { return findByPath(that.stash, path)   || '-' }
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
