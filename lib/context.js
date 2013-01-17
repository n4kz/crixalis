'use strict';

var init;

/*
 * Parse GET or POST parameters
 */
function parseParams (string) {
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
}

/* 
 * Parse Cookies
 */
function parseCookies (cookies) {
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
}

/*
 * Parse various accept headers, mainly Accept and Accept-Encoding
 */
function parseAccept (header, type) {
	var i, j, k, l, part, properties, q,
		result = [];

	if (typeof header !== 'string') {
		this[type] = result;
		return this;
	}

	header = header.split(/, */);

	for (i = 0, j = header.length; i < j; i++) {
		properties = header[i].split(/; */);

		part = {
			q: 1,
			name: properties.shift()
		};

		for (k = 0, l = properties.length; k < l; k++) {
			q = properties[k].split(/=/);
			part[q[0]] = +q[1];
		}

		result.push(part);
	}

	this[type] = result.sort(function ($a, $b) {
		return $a.q < $b.q? 1 : $a.q > $b.q? -1 : 0;
	}).filter(function ($_) {
		return $_.name && $_.q;
	}).map(function ($_) {
		return $_.name;
	});

	return this;
}

/*
 * Init context
 */
init = function () {
	var that   = this,
		req    = this.req,
		data   = '',
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
			that.emit('render');
		});
	} else {
		this.emit('auto');
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
function Context (request, response) {
	var parts, url, l;

	if (!(this instanceof Context)) {
		return new Context(request, response);
	}

	/** 
	 * Request start time
	 * @property start
	 */
	this.start = Date.now();

	/**
	 * Request object
	 * @property req
	 */
	this.req = request;

	/**
	 * Response object
	 * @property res
	 */
	this.res = response;

	/**
	 * Request method
	 * @property method
	 * @type String
	 */
	this.method = request.method;

	parts = request.headers.host.split(':', 2);

	/**
	 * Request port
	 * @property port
	 * @type Number
	 * @default 80
	 */
	this.port = +(parts[1] || 80);

	/**
	 * Request host
	 * @property host
	 * @type String
	 */
	this.host = parts[0];

	/**
	 * Request cookies
	 * @property cookies
	 * @type Object
	 */
	this.cookies = {};

	/**
	 * Request headers
	 * @property headers
	 * @type Object
	 */
	this.headers = {};

	/**
	 * Request GET and POST parameters
	 * @property parameters
	 * @type Object
	 */
	this.params = {};

	/**
	 * Request GET keywords
	 * @property keywords
	 * @type Object
	 */
	this.keywords = {};

	/**
	 * Request data storage
	 * @property stash
	 * @type Object
	 */
	this.stash = {};

	/**
	 * Render view after callback automagically if not set
	 * @property async
	 * @type Boolean
	 * @default false
	 */
	this.async = false;

	/**
	 * Request url
	 * @property url
	 * @type String
	 */
	parts = request.url.split('?', 2);
	url   = parts[0];
	l     = url.length;

	if (l > 1 && url[--l] === '/') {
		/* Chomp one trailing slash */
		this.url = url.slice(0, l);
	} else {
		this.url = url;
	}

	/* Get parameters */
	parseParams.call(this, parts[1]);

	/**
	 * Content-types extracted from Accept header
	 * @property types
	 * @type Array
	 */
	parseAccept.call(this, request.headers.accept, 'types');

	/**
	 * Accepted encodings
	 * @property codings
	 * @type Array
	 */
	parseAccept.call(this, request.headers['accept-encoding'], 'codings');

	/**
	 * Remote IP address
	 * @property address
	 * @type String
	 */
	this.address = request.headers['x-forwarded-for'] || request.connection.remoteAddress;

	/* Drop proxies from x-forwarded-for */
	this.address = this.address.split(/, */)[0];

	/* Cookies */
	parseCookies.call(this, request.headers.cookie);

	/* Set is_get, is_post and other flags */
	this['is_' + this.method.toLowerCase()] = true;

	return init.call(this);
}

module.exports = Context;
