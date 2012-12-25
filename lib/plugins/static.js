'use strict';

/**
 * Static plugin.
 * Provides basic file-serving capabilities.
 * @module Crixalis
 * @submodule static
 * @for Controller
 */

var Crixalis   = require('crixalis'),
	fs         = require('fs'),
	zlib       = require('zlib'),
	crypto     = require('crypto'),
	extensions = {
		gzip: '.gz',
		deflate: '.def'
	};

function mimeType (path) {
	path.match(/\.(\w+)$/);
	return this.mimes[RegExp.$1] || 'text/plain';
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
	 * Mime types by file extension
	 * @property mimes
	 * @type Object
	 */
	Crixalis._('mimes', {
		json : 'application/json',
		js   : 'application/javascript',
		html : 'text/html',
		css  : 'text/css',
		gif  : 'image/gif',
		jpg  : 'image/jpg',
		jpeg : 'image/jpg',
		png  : 'image/png'
	});

	/**
	 * Expirity data by mime type in milliseconds
	 * @property expires
	 * @type Object
	 */
	Crixalis._('expires', {});

	/**
	 * Serve static file
	 *
	 *     this.serve('../public/index.html', function (error) {
	 *         this.emit('error', error);
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
			stream, file;

		if (typeof callback !== 'function') {
			throw new Error('Callback must be a function');
		}

		fs.lstat(path, function (error, result) {
			if (error) {
				callback.call(that, error);
				return;
			}

			if (!result.isFile()) {
				callback.call(that, new Error('Not a file'));
				return;
			}

			/* Client closed connection */
			that.res.once('close', function () {
				if (stream) {
					stream.destroy();
				}

				that.clean();
				// FIXME: Probably we have nothing to do with closed connection
				// delete that['view'];
				// callback.call(that, new Error('Connection closed'));
			});

			/* Create readable stream */ 
			if (!that.is_head) {
				try {
					stream = fs.createReadStream(path);
				} catch (error) {
					callback.call(that, error);
					return;
				}
			}

			that.view           = 'file';
			that.stash.stat     = result;
			that.stash.path     = path;
			that.stash.stream   = stream;
			that.stash.callback = callback;

			that.emit('end');
		});

		return this;
	});

	Crixalis.prototype._views.file = function () {
		/* TODO: handle closed connection */
		var that        = this,
			stash       = this.stash,
			modified    = this.req.headers['if-modified-since'] || null,
			stream      = stash.stream,
			mime        = mimeType.call(this, stash.path),
			expires     = stash.expires || this.expires,
			mtime       = Date.parse(stash.stat.mtime),
			contentType = mime,
			notModified = false,
			ts, file, compression;

		/* Charset */
		if (stash.hasOwnProperty('charset')) {
			contentType += '; charset=' + stash.charset;
		}

		/* General headers */
		this.headers['Content-Length'] = stash.stat.size;
		this.headers['Content-Type']   = contentType;
		this.headers['Last-Modified']  = (new Date(mtime)).toUTCString();
		this.headers['Vary']           = 'Accept-Encoding';

		/* Expires */
		if (expires.hasOwnProperty(mime)) {
			ts  = +new Date();
			ts += expires[mime];
			ts  = new Date(ts);
			this.headers['Expires'] = ts.toUTCString();
		}

		/* 304 Not Modified */
		if (modified) {
			ts = Date.parse(modified);

			if (!isNaN(ts)) {
				if (mtime <= ts) {
					notModified = true;
					this.code   = 304;
				}
			}
		}

		/* HEAD or 304 */
		if (this.is_head || notModified) {
			this.sendHeaders();

			if (stream) {
				stream.destroy();
			}

			this.emit('destroy');
			return true;
		}

		if (this.compression) {
			/* Detect compression support */
			compression = this.compression();
		}

		/* Compress if possible */
		if (compression) {
			this.headers['Content-Encoding'] = compression;

			/* TODO: create folder on demand */
			file  = this.cachePath;
			file += '/';

			/* Create unique file name in cache directory */
			file += crypto.createHash('md5')
				.update(stash.path + mtime)
				.digest('hex');
			file += extensions[compression];

			fs.lstat(file, function (error, result) {
				var output, compressor,
					onError = stash.callback.bind(that),
					onClose = that.serve.bind(that, stash.path, stash.callback);

				if (compression === 'gzip') {
					compressor = zlib.createGzip();
				} else {
					compressor = zlib.createDeflate();
				}

				if (error) {
					/* Create compressed file in cache */
					output = fs.createWriteStream(file)
						.once('error', onError)
						.once('close', onClose);

					stream.pipe(compressor).pipe(output);
				} else {
					/* File already compressed */
					that.headers['Content-Length'] = result.size;

					try {
						stream = fs.createReadStream(file);
					} catch (error) {
						onError(error);
						return;
					}

					that.sendHeaders();

					/* Stream file to client */
					stream.pipe(that.res);

					/* EOF */
					stream.once('end', that.emit.bind(that, 'destroy'));
				}
			});

			return true;
		}

		/* Default, worst case, send as is */
		this.sendHeaders();

		/* Stream file to client */
		stream.pipe(this.res);

		/* EOF */
		stream.once('end', this.emit.bind(this, 'destroy'));

		return true;
	};
};
