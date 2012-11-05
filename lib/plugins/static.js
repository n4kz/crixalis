'use strict';

var Crixalis = require('crixalis'),
	fs = require('fs');

function mimeType (path) {
	path.match(/\.(\w+)$/);
	return this.mimes[RegExp.$1] || 'text/plain';
}

/**
 * Static file serving support
 * @module Context
 */
module.exports = function () {

	/**
	 * Mime types by file extension
	 * @property mimes
	 * @type object
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
	 * @type object
	 */
	Crixalis._('expires', {});

	/**
	 * Serve static file
	 * @method serve
	 * @param {String} path Path to file
	 * @param {Function} callback Callback
	 * @async
	 * @chainable
	 */
	Crixalis._('serve', function (path, callback) {
		var that = this,
			stream;

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
		var stash       = this.stash,
			stream      = stash.stream,
			modified    = this.req.headers['if-modified-since'] || null,
			mime        = mimeType.call(this, stash.path),
			expires     = stash.expires || this.expires,
			mtime       = Date.parse(stash.stat.mtime),
			contentType = mime,
			notModified = false,
			ts;

		/* Charset */
		if (stash.hasOwnProperty('charset')) {
			contentType += '; charset=' + stash.charset;
		}

		/* General headers */
		this.headers['Content-Length'] = stash.stat.size;
		this.headers['Content-Type']   = contentType;
		this.headers['Last-Modified']  = (new Date(mtime)).toUTCString();

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

			if (!Number.isNaN(ts)) {
				if (mtime <= ts) {
					notModified = true;
					this.code   = 304;
					this.body   = '';
				}
			}
		}

		this.sendHeaders();

		/* HEAD or 304 */
		if (this.is_head || notModified) {
			if (stream) {
				stream.destroy();
			}

			this.emit('destroy');
			return true;
		}

		/* Write file part */
		stream.on('data', this.res.write.bind(this.res));

		/* EOF */
		stream.once('end', this.emit.bind(this, 'destroy'));

		return true;
	};
};
