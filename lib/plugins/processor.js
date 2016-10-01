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
		error   = this.error,
		options = this.options,
		cache   = crypto.createHash('md5').update(filename + mtime).digest('hex'),
		path    = context.cachePath + '/' + cache + '.' + options.extension;

	/* Try to serve compiled file */
	context.serve(path, function (error) {
		var chain = context.chain();

		chain.context = context;
		chain.error   = error;
		chain.options = options;
		chain.path    = path;

		/*
		 * Compiled file was not found
		 * Setup new action chain to compile it
		 */
		chain.append(fs.readFile, null, [filename]);
		chain.append(before,  chain);
		chain.append(compile, chain, [filename]);
		chain.append(after,   chain);

		chain.forward();
	});

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
	this.append(fs.writeFile, undefined, [this.path, data]);

	/* Finally send data ro client */
	this.append(this.context.serve, this.context, [this.path]);

	this.forward();
}

function notFound () {
	this.context.error(404);
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
		var chain = this.chain();

		if (typeof filename !== 'string') {
			throw new Error('Filename expected to be string');
		}

		chain.context = this;
		chain.error   = notFound;
		chain.options = options;

		chain.append(fs.lstat,   null,  [filename]);
		chain.append(serveCache, chain, [filename]);

		chain.forward();

		return this;
	});
};
