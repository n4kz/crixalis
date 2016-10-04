'use strict';

/**
 * Static plugin
 * Provides basic file-serving capabilities with optional compression support and
 * LRU microcache for small files and stat calls. If `route` parameter is set
 * will try to serve all paths with extensions.
 *
 *     // Default options
 *     Crixalis.plugin('static');
 *
 *     // Custom options
 *     Crixalis.plugin('static', {
 *         // Create route for all paths with extension (false by default)
 *         route: true,
 *
 *         // Follow symlinks (false by default)
 *         symlinks: true,
 *
 *         // Cache files and stat calls for 1 hour (defaults to 307ms)
 *         cacheTime: 3600000,
 *
 *         // Cache up to 512 stat objects (defaults to 128)
 *         statCacheSize: 512,
 *
 *         // Set cache size for files (in bytes, defaults to 1Mb)
 *         fileCacheSize: 16 * 1024 * 1024
 *     });
 *
 * @module Crixalis
 * @submodule static
 * @for Crixalis
 */

var fs         = require('fs'),
	zlib       = require('zlib'),
	crypto     = require('crypto'),
	mime       = require('mime'),
	normalize  = require('path').normalize,
	AsyncCache = require('async-cache'),
	extensions = {
		gzip    : '.gz',
		deflate : '.def'
	};

function send (context, file, size) {
	context.emit('response');

	context.sendHeaders();

	if (file && context.method !== 'HEAD') {
		if (size > context._streamLimit) {
			/* Stream big files */
			fs.createReadStream(file)
				.on('end', function () {
					context.destroyContext();
				})
				.pipe(context.res);
		} else {
			/* Serve small files from cache */
			context._fileCache.get(file, function (error, result) {
				context.res.end(result);
				context.destroyContext();
			});
		}
	} else {
		context.res.end();
		context.destroyContext();
	}
}

function sha1 (data, mode) {
	return crypto
		.createHash('sha1')
		.update(data)
		.digest(mode);
}

function etag (stat) {
	return sha1([stat.ino, stat.size, stat.mtime].join(), 'base64')
		.replace(/=+$/, '');
}

module.exports = function (options) {
	options = Object(options);

	var stat      = options.symlinks? fs.stat : fs.lstat,
		cacheTime = Number(options.cacheTime || 307),
		statCache = new AsyncCache({
			max    : Number(options.statCacheSize || 1 << 7),
			maxAge : cacheTime,
			length : function () { return 1 },
			load   : function (file, callback) {
				stat(file, function (error, result) {
					fileCache.del(file);
					callback(error, result);
				})
			}
		}),
		fileCache  = new AsyncCache({
			max    : Number(options.fileCacheSize || 1 << 20),
			length : function () { return arguments[0].length },
			load   : fs.readFile
		});

	/* Provide static feature */
	this.define('feature::static');

	/* Default static route */
	if (options.route) {
		this.route(/^\/(.+)\.([^.\/]+)$/, {
			methods: ['GET', 'HEAD'],
			mapping: {
				'$1': 'path',
				'$2': 'extension'
			}
		}, function () {
			var that      = this,
				extension = this.params.extension,
				path      = normalize(this.staticPath + '/' + this.params.path + '.' + extension);

			/* Resolved path points somewhere outside */
			if (path.indexOf(normalize(this.staticPath))) {
				return false;
			}

			this[typeof this[extension] === 'function'? extension : 'serve'](path, function (error) {
				that.error(404);
			});
		});
	}

	/**
	 * Where Crixalis should look for static files. Crixalis will not
	 * create any directories, you should do it yourself.
	 * @property staticPath
	 * @type String
	 * @default public
	 */
	this.define('staticPath', 'public', { writable: true });

	/**
	 * Where Crixalis should store compressed files. Crixalis will not
	 * create any directories, you should do it yourself.
	 * @property cachePath
	 * @type String
	 * @default os.tmpdir()
	 */
	this.define('cachePath', require('os').tmpdir(), { writable: true });

	/**
	 * Expirity data by mime type in milliseconds
	 * @property expires
	 * @type Object
	 */
	this.define('expires', Object.create(null));

	/**
	 * Files smaller than 32K will not be streamed
	 * @property _streamLimit
	 * @type Number
	 * @default 32768
	 * @private
	 */
	this.define('_streamLimit', 32768, { writable: true });

	/**
	 * Cache for small files
	 * @property _fileCache
	 * @type AsyncCache
	 * @private
	 */
	this.define('_fileCache', fileCache);

	/**
	 * Cache for data from fs.stat and fs.lstat calls
	 * @property _statCache
	 * @type AsyncCache
	 * @private
	 */
	this.define('_statCache', statCache);

	/**
	 * Serve static file
	 *
	 *     this.serve('../public/index.html');
	 *
	 * When callback is omitted this.error() is called
	 * in case of any errors
	 *
	 * @method serve
	 * @param {String} path Path to file
	 * @param {Function} [callback] Callback
	 * @chainable
	 */
	this.define('serve', function (path, callback) {
		var that = this,
			stats;

		callback = callback || this.error;

		if (typeof callback !== 'function') {
			throw new Error('Callback must be a function');
		}

		this._statCache.get(path, function (error, result) {
			if (error) {
				callback.call(that, error);
				return;
			}

			if (!result.isFile()) {
				callback.call(that, new Error('Not a file'));
				return;
			}

			that.stash.path = path;
			that.stash.stat = result;

			that.render('file');
		});

		return this;
	});

	this.define('view::file', function () {
		var that        = this,
			stash       = this.stash,
			headers     = this.headers,
			contentType = mime.lookup(stash.path),
			expires     = this.expires[contentType],
			mtime       = stash.stat.mtime,
			charset     = stash.charset,
			entityTag   = etag(stash.stat),
			ifmodsince  = Date.parse(this.req.headers['if-modified-since']),
			file, compression, entityTags;

		if (null == charset && /javascript|json|text|xml/.test(contentType)) {
			charset = 'utf-8';
		}

		/* Add charset to Content-Type */
		if (charset) {
			contentType += '; charset=';
			contentType += charset;
		}

		/* Extract entity tags */
		entityTags = /^(?:"([A-Za-z0-9\/+]+)(?:-[gd])?"(?:,\s*)?)+$/
			.exec(this.req.headers['if-none-match']) || [];

		/* Verify entity tags and check file modification time */
		if (+mtime === ifmodsince || ~entityTags.indexOf(entityTag)) {
			this.code = 304;

			return !!send(this, null, 0);
		}

		headers['Vary']           = 'Accept-Encoding';
		headers['Content-Length'] = stash.stat.size;
		headers['Content-Type']   = contentType;
		headers['ETag']           = '"' + entityTag + '"';
		headers['Last-Modified']  = mtime.toUTCString();

		if (expires) {
			headers['Expires'] = (new Date(this.stamp + expires)).toUTCString();
		}

		/* Detect compression support */
		if (typeof this.compression === 'function') {
			compression = this.compression();
		}

		/* Compress if possible */
		if (compression) {
			headers['Content-Encoding'] = compression;
			headers['ETag']             = '"' + entityTag + '-' + extensions[compression][1] + '"';

			file  = this.cachePath;
			file += '/';

			/* Create unique file name in cache directory */
			file += sha1([stash.path, mtime].join(), 'hex');
			file += extensions[compression];

			this._statCache.get(file, function (error, result) {
				if (!error) {
					send(that, file, headers['Content-Length'] = result.size);
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
						send(that, file, headers['Content-Length'] = length);
					});

				stream
					.pipe(compressor)
					.pipe(cache);
			});

			return false;
		}

		/* Send file */
		return !!send(this, stash.path, headers['Content-Length']);
	});
};
