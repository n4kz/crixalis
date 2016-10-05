'use strict';

/**
 * Core plugin
 * Contains core methods and properties
 * @module    Crixalis
 * @submodule core
 * @for Crixalis
 */

module.exports = function () {
	var status = require('http').STATUS_CODES;


	/* Private methods */


	/**
	 * Destroy context
	 * @method destroyContext
	 * @private
	 */
	this.define('destroyContext', function () {
		/**
		 * Event fired on context destruction
		 * @event destroy
		 */
		this.emit('destroy');

		this.stash    = null;
		this.headers  = null;
		this.cookies  = null;
		this.params   = null;
		this.keywords = null;
	});

	/**
	 * Write response to socket and destroy context
	 * @method sendResponse
	 * @private
	 */
	this.define('sendResponse', function () {
		if (this.body) {
			if (!('Content-Length' in this.headers)) {
				/* Write Content-Length */
				this.headers['Content-Length'] = Buffer.byteLength(this.body);
			}
		}

		/**
		 * Emitted when response is ready to be sent
		 * @event response
		 */
		this.emit('response');

		/* Write headers */
		this.sendHeaders();

		/* Write body */
		if (this.body && this.method !== 'HEAD') {
			this.res.write(this.body);
		}

		/* End request */
		this.res.end();

		this.destroyContext();
	});


	/* Public methods */


	/**
	 * Write response headers to socket
	 * @method sendHeaders
	 */
	this.define('sendHeaders', function () {
		var res     = this.res,
			headers = this.headers,
			header, data, field, i, l;

		if (this.signature) {
			headers['X-Powered-By'] = this.signature;
		}

		for (header in headers) {
			if (!headers.hasOwnProperty(header)) {
				continue;
			}

			data = headers[header];

			if (null == data) {
				continue;
			}

			if (Array.isArray(data)) {
				for (i = 0, l = data.length; i < l; i++) {
					res.setHeader(header, data[i]);
				}
			} else {
				res.setHeader(header, data);
			}
		}

		res.writeHead(this.code || 200);
	});

	/**
	 * Emit error event
	 * @method error
	 * @param {Number|Error} error Error code or object
	 */
	this.define('error', function (error) {
		if (typeof error === 'number') {
			this.code = error;
			error = new Error(status[error]);
		}

		this.emit('error', error);
	});

	/**
	 * Shortcut to start server
	 * @method start
	 * @param {String} protocol Server protocol family
	 * @param {Number} [port] Port number
	 * @param {String} [host] Hostname
	 * @param {Number} [backlog] Maximum length of the queue of pending connections
	 * @param {Function} [callback] Callback for 'listening' event
	 * @return {Server}
	 */
	this.define('start', function (protocol) {
		var server = require(protocol)
				.createServer(this.createContext.bind(this));

		server.listen.apply(server, [].slice.call(arguments, 1));

		return server;
	});

	/**
	 * Send Set-Cookie header in response
	 * @param {Object} properties Cookie properties
	 * @method cookie
	 */
	this.define('cookie', function (properties) {
		var headers = this.headers,
			header = '';

		if (!properties || typeof properties !== 'object') {
			throw new Error('Object expected');
		}

		if (!properties.name) {
			throw new Error('Cookie name required');
		}

		/* Set HttpOnly by default */
		if (!('http' in properties)) {
			properties.http = true;
		}

		header += properties.name;
		header += '=';

		if (null == properties.value) {
			properties.expires = new Date(0);
		} else {
			header += properties.value;
		}

		/* Domain */
		if (properties.domain) {
			header += '; domain=';
			header += properties.domain;
		}

		/* Path */
		if (properties.path) {
			header += '; path=';
			header += properties.path;
		}

		/* Expirity information */
		if (properties.expires) {
			header += '; expires=';

			if (!(properties.expires instanceof Date)) {
				properties.expires = new Date(properties.expires);
			}

			header += properties.expires.toUTCString();
		}

		if (properties.http) {
			header += '; httponly';
		}

		if (properties.secure) {
			header += '; secure';
		}

		if (!headers['Set-Cookie']) {
			headers['Set-Cookie'] = [];
		} else {
			if (!Array.isArray(headers['Set-Cookie'])) {
				headers['Set-Cookie'] = [headers['Set-Cookie']];
			}
		}

		headers['Set-Cookie'].push(header);
	});

	/**
	 * Redirect to another url
	 * @param {String} url Target url
	 * @method redirect
	 */
	this.define('redirect', function (url) {
		this.stash.redirectURL = url;
		this.render();
	});


	/* Views */


	/* Stash-based render */
	this.define('view::auto', function () {
		var stash = this.stash;

		/* Redirect to another resource */
		if (stash.hasOwnProperty('redirectURL')) {
			this.code = this.code || 302;
			this.body = status[this.code];

			this.headers['Content-Type'] = 'text/html; charset=utf-8';
			this.headers['Location']     = stash.redirectURL;
		}

		/* JSON */
		else if (stash.hasOwnProperty('json')) {
			this.body = JSON.stringify(stash.json);

			this.headers['Content-Type'] = 'application/json; charset=utf-8';
		}

		/* HTML */
		else if (this.body) {
			this.headers['Content-Type'] = 'text/html; charset=utf-8';
		}

		/* No content */
		else if (this.method === 'GET' || this.method === 'HEAD') {
			this.code = this.code || 204;
		}

		else {
			/* Nothing to do */
		}
	});
};
