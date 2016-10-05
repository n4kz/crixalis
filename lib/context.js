'use strict';

var lc = ''.toLowerCase;

/*
 * Parse GET or POST parameters
 */
function parseParams (string) {
	var i, j, value, parts, params, key;

	if (typeof string !== 'string') {
		return this;
	}

	params = string
		.replace(/\+/g, ' ')
		.split(/[&;]/);

	for (i = 0, j = params.length; i < j; i++) {
		parts = params[i].split('=', 2);
		key = decodeURIComponent(parts[0]);

		if (!key) {
			continue;
		}

		if (parts.length === 1) {
			this.keywords[key] = true;
		} else {
			this.params[key] = decodeURIComponent(parts[1]);
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

/**
 * Request context
 * @class Context
 * @extends Crixalis
 * @param {Object} request Request object
 * @param {Object} response Response object
 * @constructor
 */
function Context (request, response) {
	var parts, url, length, data, that;

	/**
	 * Request start time
	 * @property stamp
	 */
	this.stamp = Date.now();

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

	parts = (request.headers.host || '').split(':', 2);

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
	 * Request url
	 * @property url
	 * @type String
	 */
	parts  = request.url.split('?', 2);
	url    = parts[0];
	length = url.length;

	if (length > 1 && url[--length] === '/') {
		/* Chomp one trailing slash */
		this.url = url.slice(0, length);
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
	parseAccept.call(this, request.headers.accept || '*/*', 'types');

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

	if (this.method === 'POST' || this.method === 'PUT') {
		that   = this;
		data   = '';
		length = 0;

		this.req
			.on('data', function (chunk) {
				if (chunk instanceof Buffer) {
					length += chunk.length;
					data   += chunk.toString();
				} else {
					length += Buffer.byteLength(chunk);
					data   += chunk;
				}

				/* Check length */
				if (length > that.postSize) {
					this.removeAllListeners();
					that.error(413);
				}
			})
			.once('end', function () {
				var key, type, property, properties, i, l,
					message = {};

				if (length) {
					properties = (this.headers['content-type'] || 'application/octet-stream').split(/; */);

					for (i = 1, l = properties.length; i < l; i++) {
						property = properties[i].split(/=/);
						message[property[0]] = lc.call(property[1]);
					}

					message.type   = properties[0];
					message.length = length;

					/**
					 * HTTP message
					 * @property message
					 * @type Object
					 */
					that.message = message;

					switch (message.type) {
						case 'application/octet-stream':
							message.data = data;
							break;

						case 'application/x-www-form-urlencoded':
							parseParams.call(that, data);
							break;

						case 'application/json':
							try {
								message.data = JSON.parse(data);
							} catch (error) {
								that.error(400);
								return;
							}
							break;

						/* TODO: application/multipart-formdata */

						default:
							that.error(415);
							return;
					}
				}

				that.emit('auto');
			});
	} else {
		this.emit('auto');
	}

	return this;
}

module.exports = Context;
