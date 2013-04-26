'use strict';

/**
 * Processor plugin. Useful for writing preprocessor plugins (like coffee). Compiled
 * files are stored in cachePath
 * @module Crixalis
 * @submodule processor
 * @for Controller
 */

var Crixalis = require('../controller'),
	crypto   = require('crypto'),
	fs       = require('fs'),
	cache    = {};

function serveCache (filename) {
	var result  = this.results.pop(),
		mtime   = +result.mtime,
		context = this.context,
		cache   = crypto.createHash('md5').update(filename + mtime).digest('hex');

	this.path = context.cachePath + '/' + cache + '.' + this.options.extension;

	/* Serve compiled file */
	this.tunnel(context.serve, context, [this.path, createCache.bind(this, filename)]);

	/* Without async queue will be cleaned */
	this.async = true;
	this.forward();
	this.aync  = false;
}

function createCache (filename) {
	this.tunnel(fs.readFile, undefined, [filename]);

	this.tunnel(before, this);

	this.tunnel(compile, this, [filename]);

	this.tunnel(after, this);

	this.forward();
}

function before () {
	this.data = this.results.pop().toString();

	/* Change error handler */
	this.error = onError;

	this.forward();
}

function compile (filename) {
	var result;

	try {
		result = this.options.compile.call(this, filename, this.data, this.options);
	} catch (error) {
		this.forward(error);
		return;
	}

	if (!this.options.async) {
		this.forward(undefined, result);
	}
}

function after () {
	var data = this.results.pop();

	/* Write compiled file to disk */
	this.tunnel(fs.writeFile, undefined, [this.path, data]);

	/* Finally send data ro client */
	this.tunnel(this.context.serve, this.context, [this.path]);

	this.forward();
}

function notFound () {
	this.context.emit('default');
}

function onError (error) {
	this.context.emit('error', error, true);
}

module.exports = function (options) {
	if (!options || typeof options !== 'object') {
		throw new Error('Options required');
	}

	if (typeof options.method !== 'string') {
		throw new Error('options.method expected to be string');
	}

	if (typeof options.compile !== 'function') {
		throw new Error('options.compile expected to be function');
	}

	options.extension = options.extension || method;

	Crixalis.define('method', options.method, function (filename) {
		var burrow = this.burrow();

		if (typeof filename !== 'string') {
			throw new Error('Filename expected to be string');
		}

		burrow.context = this;
		burrow.error   = notFound;
		burrow.options = options;

		burrow.tunnel(fs.lstat, undefined, [filename])
		burrow.tunnel(serveCache, burrow, [filename]);

		burrow.forward();

		return this;
	});
};
