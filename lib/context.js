'use strict';

var parseParams,
	parseCookies, 
	init;

/*
 * Parse GET or POST parameters
 */
parseParams = function (string) {
	var i, j, value, parts, params;

	if (typeof string !== 'string') {
		return this;
	}

	params = string.split(/[&;]/);

	for (i = 0, j = params.length; i < j; i++) {
		parts = params[i].split('=', 2);
		if (parts[1]) {
			value = decodeURIComponent(parts[1]);
			if (this.is_post) {
				this.params[parts[0]] = value.replace(/\+/g, ' ');
			} else {
				this.params[parts[0]] = value;
			}
		} else {
			this.keywords[parts[0]] = 1;
		}
	}

	return this;
};

/* 
 * Parse Cookies
 */
parseCookies = function (cookies) {
	var i, j, cookie, parts;

	if (typeof cookies !== 'string') {
		return this;
	}

	cookies = cookies.split(/; */);

	for (i = 0, j = cookies.length; i < j; i++) {
		cookie = cookies[i];

		if (cookie) {
			parts = cookie.split('=', 2);
			if (parts[0]) {
				this.cookies[parts[0]] = parts[1] || '';
			}
		}
	}

	return this;
};

/*
 * Init context
 */
init = function () {
	var that = this,
		req  = this.req,
		data = '',
		length = 0;

	if (this.is_post) {
		req.on('data', function (chunk) {
			if (chunk instanceof Buffer) {
				length += chunk.length;
				data   += chunk.toString();
			} else {
				length += Buffer.byteLength(chunk);
				data   += chunk;
			}

			/*
			 * Request is too big (100K)
			 * TODO: Make this configurable
			 */
			if (length > 1E+5) {
				data   = null;
				length = 0;
				req.connection.destroy();
			}
		});

		req.once('end', function () {
			if (length) {
				parseParams.call(that, data);
			}

			that.emit('auto');
		});

		req.once('close', function () {
			that.emit('end');
		});
	} else {
		process.nextTick(this.emit.bind(this, 'auto'));
	}

	return this;
};

/**
 * Request context
 * @class Context
 * @extends Controller
 * @param {Controller} controller Controller instance
 * @param {Object} request Request object
 * @param {Object} response Response object
 * @constructor
 */
function Context (controller, request, response) {
	var parts, that;

	/* Make controller methods usable */
	that = Object.create(controller);

	/**
	 * Request object
	 * @property req
	 */
	that.req = request;

	/**
	 * Response object
	 * @property res
	 */
	that.res = response;

	/**
	 * Request method
	 * @property method
	 * @type String
	 */
	that.method = request.method;

	/**
	 * Request url
	 * @property url
	 * @type String
	 */
	that.url = request.url;

	that.host = request.headers.host.split(':', 2);

	/**
	 * Request port
	 * @property port
	 * @type Number
	 * @default 80
	 */
	that.port = +(that.host[1] || 80);

	/**
	 * Request host
	 * @property host
	 * @type String
	 */
	that.host = that.host[0];

	/**
	 * Request cookies
	 * @property cookies
	 * @type Object
	 */
	that.cookies = {};

	/**
	 * Request headers
	 * @property headers
	 * @type Object
	 */
	that.headers = {};

	/**
	 * Request GET and POST parameters
	 * @property parameters
	 * @type Object
	 */
	that.params = {};

	/**
	 * Request GET keywords
	 * @property keywords
	 * @type Object
	 */
	that.keywords = {};

	/**
	 * Request data storage
	 * @property stash
	 * @type Object
	 */
	that.stash = {};

	/**
	 * Render view after callback automagically if not set
	 * @property async
	 * @type Boolean
	 * @default false
	 */
	that.async = false;

	/*
		that.is_post    = false;
		that.is_head    = false;
		that.is_get     = false;
	*/

	/* URL */
	parts    = that.url.split('?', 2);
	that.url = parts[0];

	/* Get parameters */
	parseParams.call(that, parts[1]);

	/**
	 * Content-types extracted from Accept header
	 * @property types
	 * @type Array
	 */
	that.types = (request.headers.accept || '').split(/[;,] */);

	/**
	 * Remote IP address
	 * @property address
	 * @type String
	 */
	that.address = request.connection.remoteAddress || request.headers['X-Forwarded-For'];

	/* Cookies */
	parseCookies.call(that, request.headers.cookie);

	/* Set is_get, is_post and others flags */
	that['is_' + that.method.toLowerCase()] = true;

	/**
	 * Clean context
	 * @method clean
	 * @chainable
	 */
	that.clean = function () {
		var stash = that.stash,
			field;

		/* Clean stash */
		for (field in stash) {
			if (stash.hasOwnProperty(field)) {
				delete stash[field];
			}
		}

		/* Clean context */
		for (field in that) {
			if (that.hasOwnProperty(field)) {
				delete that[field];
			}
		}

		return that;
	};

	return init.call(that);
}

module.exports = Context;
