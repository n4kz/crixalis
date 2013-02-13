'use strict';

/**
 * Static plugin.
 * Provides basic file-serving capabilities.
 * @module Crixalis
 * @submodule static
 * @for Controller
 */

var Crixalis   = require('crixalis').self,
	fs         = require('fs'),
	zlib       = require('zlib'),
	crypto     = require('crypto'),
	mime       = require('mime'),
	extensions = {
		gzip    : '.gz',
		deflate : '.def'
	};

function destroy () {
	if (this.stash.stream) {
		this.stash.stream.destroy();
		this.stash.stream = null;
	}

	this.stash.stat = null;
	this._destroy();
}

function send (file, size) {
	this.emit('response');

	this.sendHeaders();

	if (!this.is_head && file) {
		if (size > this._streamLimit) {
			/* Stream big files */
			fs.createReadStream(file)
				.pipe(this.res)
				.on('end', destroy.bind(this));

			return;
		} else {
			/* Send small files */
			this.res.end(fs.readFileSync(file));
		}
	} else {
		this.res.end();
	}

	destroy.call(this);
}

module.exports = function () {
	/**
	 * Where Crixalis should store compressed files. Crixalis will not
	 * create any directories, you should do it yourself.
	 * @property cachePath
	 * @type String
	 * @default .
	 */
	Crixalis._('cachePath', '.');

	/**
	 * Expirity data by mime type in milliseconds
	 * @property expires
	 * @type Object
	 */
	Crixalis._('expires', {});

	/**
	 * If set will use stat instead of lstat to get fileinfo
	 * @property symlinks
	 * @type Boolean
	 * @default false
	 * @private
	 */
	Crixalis._('_symlinks', false);

	/**
	 * Files smaller than 32K will not be streamed
	 * @property _streamLimit
	 * @type Number
	 * @default 32768
	 * @private
	 */
	Crixalis._('_streamLimit', 32768);

	/**
	 * Serve static file
	 *
	 *     this.serve('../public/index.html', function (error) {
	 *         this.error(error);
	 *     }.bind(this));
	 *
	 * @method serve
	 * @param {String} path Path to file
	 * @param {Function} callback Callback
	 * @async
	 * @chainable
	 */
	Crixalis._('serve', function (path, callback) {
		var that = this,
			stat = this._symlinks? fs.stat : fs.lstat,
			stats;

		if (typeof callback !== 'function') {
			throw new Error('Callback must be a function');
		}

		stat(path, function (error, result) {
			if (error) {
				callback.call(that, error);
				return;
			}

			if (!result.isFile()) {
				callback.call(that, new Error('Not a file'));
				return;
			}

			that.stash.path     = path;
			that.stash.callback = callback;
			that.stash.stat     = result;

			that.render('file');
		});

		/* Client closed connection */
		that.res.on('close', function () {
			destroy.call(that);
		});

		return this;
	});

	Crixalis._define('file', function () {
		var that        = this,
			stash       = this.stash,
			headers     = this.headers,
			contentType = mime.lookup(stash.path),
			expires     = this.expires[contentType],
			mtime       = stash.stat.mtime,
			stat        = this._symlinks? fs.stat : fs.lstat,
			file, compression;

		/* Add charset to content-type */
		contentType += '; charset=';
		contentType += stash.charset || 'utf-8';

		headers['Last-Modified'] = mtime.toUTCString();

		/* TODO: Check ETag */

		/* Check file modification time */
		if (+mtime === Date.parse(this.req.headers['if-modified-since'])) {
			this.code = 304;
			send.call(this);
			return false;
		}

		headers['Vary']           = 'Accept-Encoding';
		headers['Content-Length'] = stash.stat.size;
		headers['Content-Type']   = contentType;

		if (expires) {
			headers['Expires'] = (new Date(this.start + expires)).toUTCString();
		}

		/* Detect compression support */
		if (typeof this.compression === 'function') {
			compression = this.compression();
		}

		/* Compress if possible */
		if (compression) {
			headers['Content-Encoding'] = compression;

			file  = this.cachePath;
			file += '/';

			/* Create unique file name in cache directory */
			file += crypto.createHash('md5')
				.update(stash.path + mtime)
				.digest('hex');
			file += extensions[compression];

			stat(file, function (error, result) {
				if (!error) {
					send.call(that, file, headers['Content-Length'] = result.size);
					return;
				}

				var compressor = zlib[compression === 'gzip'? 'createGzip' : 'createDeflate'](),
					length     = 0,

					/* Source file */
					stream     = fs.createReadStream(stash.path),

					/* Compressed file in cache */
					cache      = fs.createWriteStream(file);

				compressor
					.on('data', function (data) {
						length += data.length;
					});

				cache
					.on('close', function () {
						send.call(that, file, headers['Content-Length'] = length);
					});

				stream.pipe(compressor).pipe(cache);
			});

			return false;
		}

		/* Send file */
		send.call(this, stash.path, headers['Content-Length']);

		return false;
	});
};
