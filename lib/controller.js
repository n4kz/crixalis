'use strict';

/**
 * Lightweight web framework
 * @module Crixalis
 */

var Route   = require('./route'),
	Context = require('./context'),
	Chain   = require('./chain'),
	status  = require('http').STATUS_CODES,
	util    = require('util'),
	events  = require('events'),
	plugins = [
		'request', 'static', 'compression', 'processor',
		'coffee', 'less', 'jade', 'shortcuts', 'access'
	];

/**
 * @class Controller
 * @constructor
 */
function Controller() {
	if (!(this instanceof Controller)) {
		return new Controller();
	}

	return this;
}

util.inherits(Controller, events.EventEmitter);

var Crixalis
	= Context.prototype
	= module.exports
	= new Controller();

function define (type, name, value, descriptor) {
	var target = Crixalis;

	descriptor = descriptor || {};
	descriptor.value = value;
	descriptor.enumerable = true;

	if (!('writable' in descriptor)) {
		descriptor.writable = true;
	}

	switch (type) {
		case 'handler':
			Crixalis.on(name, value);
			return this;

		case 'method':
			if (typeof value !== 'function') {
				throw new Error('Method must be a function');
			}

			descriptor.enumerable = false;
			break;

		case 'property':
			break;

		case 'view':
			if (typeof value !== 'function') {
				throw new Error('View must be a function');
			}

			target = Crixalis._views;
			descriptor.writable = false;
			break;

		default:
			throw new Error('Unsupported definition type ' + type);
	}

	Object.defineProperty(target, name, descriptor);
	return this;
}

/**
 * Extend controller with property, method, view or add event handler
 * @method define
 * @param {String} type Can be 'property', 'method', 'view', 'event'
 * @param {String} name
 * @param {Any} value
 * @chainable
 */
define('method', 'define', define);


/* Properties */


/**
 * Registered views
 * @private
 * @property _views
 * @type Object
 */
define('property', '_views', Object.create(null), { writable: false });

/**
 * Registered url-based routes
 * @private
 * @property _routes
 * @type Object
 */
define('property', '_routes', Object.create(null), { writable: false });

/**
 * Registered pattern-based routes
 * @private
 * @property _patterns
 * @type Array
 */
define('property', '_patterns', [], { writable: false });

/**
 * Crixalis version
 * @property version
 * @type String
 */
define('property', 'version', require('../package').version, { writable: false });

/**
 * XXX: Deprecated, call render() explicitly
 * @property async
 * @type Boolean
 * @default true
 */
define('property', 'async', true, { writable : false });

/**
 * Default logger
 * @property logger
 * @type Object
 */
define('property', 'logger', console);

/**
 * Maximum POST body size in bytes
 * @property postSize
 * @type Number
 * @default 1048576 (1MB)
 */
define('property', 'postSize', 1048576);

/**
 * Response code
 * @property code
 * @type Number
 */
define('property', 'code', 0);

/**
 * Response body
 * @property body
 * @type String
 */
define('property', 'body', '');

/**
 * Default view. Should be one of the
 * available views: json, html, null, etc.
 * @property view
 * @type String
 * @default html
 */
define('property', 'view', 'html');

/**
 * Server signature, X-Powered-By header.
 * Set to falsy value to disable
 * @property signature
 * @type String
 * @default Crixalis
 */
define('property', 'signature', 'Crixalis');

/* Set common methods */
['head', 'post', 'put', 'get'].forEach(function (method) {
	define('property', 'is_' + method, false);
});


/* Views */


/* Empty view */
define('view', 'null', function () {});

/* JSON */
define('view', 'json', function () {
	this.headers['Content-Type'] = 'application/json; charset=utf-8';
	this.body = JSON.stringify(this.stash.json);
});

/* Padded JSON */
define('view', 'jsonp', function () {
	this.headers['Content-Type'] = 'application/javascript; charset=utf-8';
	this.body = this.params.callback + '(' + JSON.stringify(this.stash.json) + ');';
});

/* Old plain html */
define('view', 'html', function () {
	this.headers['Content-Type'] = 'text/html; charset=utf-8';
});

/* Redirect to another resource */
define('view', 'redirect', function () {
	this.code = 302;
	this.body = status[302];

	this.headers['Content-Type'] = 'text/html; charset=utf-8';
	this.headers['Location']     = this.stash.url;
});


/* Methods */


/**
 * Add new route to _routes or _patterns, depending on route type.
 * @method _route
 * @private
 * @param {Route} route Route object to add
 * @param {Function} callback Function to be called when route matches
 */
define('method', '_route', function (route, callback) {
	var key = route.url || route.pattern,
		placeholders;

	if (!(route instanceof Route)) {
		throw new Error('Expecting Route instance');
	}

	if (typeof callback !== 'function') {
		throw new Error('Callback must be a function');
	}

	if (typeof key === 'string' && /:\w/.test(key)) {
		route.capture = {};
		placeholders  = 1;

		route.pattern = key = new RegExp('^' + key.split(/(:\w+)/).map(function (part) {
			if (part[0] === ':') {
				route.capture['$' + placeholders++] = part.slice(1);

				return '([^\\/]+?)';
			}

			return part.replace(/[\/()\[\]{}?^$+*.,]/g, function (char) { return '\\' + char });
		}).join('') + '$', 'i');

		delete route.url;
	}

	if (typeof key === 'string') {
		if (!(Array.isArray(this._routes[key]))) {
			this._routes[key] = [];
		}

		this._routes[key].push({
			route    : route.copy().unset('controller'),
			callback : callback
		});
	} else {
		if (!(key instanceof RegExp)) {
			throw new Error('Nothing to route');
		}

		this._patterns.push({
			route    : route.copy().unset('controller'),
			callback : callback
		});
	}
});

/**
 * Write response to socket and destroy context
 * @method _response
 * @private
 */
define('method', '_response', function () {
	if (this.body) {
		if (!('Content-Length' in this.headers)) {
			/* Write Content-Length */
			this.headers['Content-Length'] = Buffer.byteLength(this.body);
		}
	}

	/**
	 * Emitted when response is ready,
	 * but nothing were sent to client yet
	 * @event response
	 */
	this.emit('response');

	/* Write headers */
	this.sendHeaders();

	/* Write body */
	if (this.body && !this.is_head) {
		this.res.write(this.body);
	}

	/* End request */
	this.res.end();

	this._destroy();
});

/**
 * Destroy context
 * @method _destroy
 * @private
 */
define('method', '_destroy', function () {
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
 * Create new Context with provided request and response objects
 * @method createContext
 * @param {Object} request
 * @param {Object} response
 */
define('method', 'createContext', function (request, response) {
	return new Context(request, response);
});

/**
 * Create route object for current controller
 * @method router
 * @param {Object} options Options for route constructor
 * @return {Route} New route object
 */
define('method', 'router', function (options) {
	return new Route(this, options);
});

/**
 * Method writes headers out
 * @method sendHeaders
 * @chainable
 */
define('method', 'sendHeaders', function () {
	var res     = this.res,
		headers = this.headers,
		header, data, field, i, l;

	if (this.signature) {
		headers['X-Powered-By'] = this.signature;
	}

	for (header in headers) {
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

	res.writeHead(this.code || 200)

	return this;
});

/**
 * Load plugin
 * @method plugin
 * @param {String} plugin Plugin name
 * @param {Object} options Options for plugin loader
 * @chainable
 */
define('method', 'plugin', function (plugin, options) {
	var loader;

	if (~plugins.indexOf(plugin)) {
		loader = require('./plugins/' + plugin);
	} else {
		loader = require(plugin);
	}

	if (typeof loader !== 'function') {
		throw new Error('Plugin returned unexpected value');
	}

	loader.call(this, options);
	return this;
});

/**
 * Select best route. Method should be called in __auto__ event handler.
 *
 *     this.on('auto', function () {
 *         console.log(this.method + ' ' + this.url);
 *
 *         this.select();
 *     }.bind(this));
 *
 * @method select
 * @chainable
 */
define('method', 'select', function () {
	var queue = this._routes[this.url],
		patts = false,
		i = 0, l, result;

	if (!(Array.isArray(queue))) {
		patts = true;
		queue = this._patterns;
	}

	l = queue.length;
	while (i < l) {
		/* Route matches */
		if (queue[i].route.match(this)) {
			/* Execute route callback */
			result = queue[i].callback.call(this);

			/* Go to next route on false */
			if (result !== false) {
				return this;
			}
		}

		/* Flip to patterns queue */
		if (++i === l && !patts) {
			patts = true;
			queue = this._patterns;
			i     = 0;
			l     = queue.length;
		}
	}

	/* Nothing matched */
	this.emit('default');

	return this;
});

/**
 * Transform context using selected view and send
 * data to client
 * @method render
 * @param {String} [view] View name
 * @chainable
 */
define('method', 'render', function (view) {
	var fn = this._views[view || this.view];

	if (typeof fn === 'function') {
		if (fn.call(this) === false) {
			/* Async view */
			return this;
		}
	} else {
		throw new Error('Unsupported view ' + (view || this.view));
	}

	if (this.body) {
		if (this.compression) {
			this.emit('compression');
			return this;
		}
	}

	this._response();

	return this;
});

/**
 * Emit error event
 * @method error
 * @param {Error} error Error object
 * @param {Boolean} [render] Call render() after emitting error
 * @chainable
 */
define('method', 'error', function (error, render) {
	if (typeof error === 'number') {
		this.code = error;
		error = new Error(status[error]);
	}

	this.emit('error', error);

	if (render) {
		this.render();
	}

	return this;
});

/**
 * Redirect to another url
 * @param {String} url Target url
 * @method redirect
 * @chainable
 */
define('method', 'redirect', function (url) {
	this.view = 'redirect';
	this.stash.url = url;
	return this;
});

/**
 * Send Set-Cookie header in response
 * @param {Object} properties Cookie properties
 * @method cookie
 * @chainable
 */
define('method', 'cookie', function (properties) {
	var headers = this.headers,
		header = '';

	if (typeof properties !== 'object') {
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

	return this;
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
define('method', 'start', function (protocol) {
	var server = require(protocol)
		.createServer(this.createContext.bind(this));

	server.listen.apply(server, [].slice.call(arguments, 1));

	return server;
});

/**
 * Create chain
 * @method chain
 * @return {Chain}
 */
define('method', 'chain', function () { return new Chain() });

/**
 * Empty function
 * @method noop
 * @chainable
 */
define('method', 'noop', function () { return this; });


/* Events */


/**
 * Default auto action
 * Fired when context is ready for dispatch
 * @event auto
 */
define('handler', 'auto', Crixalis.select);

/**
 * Default action
 * fired when nothing matches
 * @event default
 */
define('handler', 'default', function () {
	this.code = 404
	this.body = status[404];

	this.render();
});

/**
 * Fired when error occured
 * @event error
 * @param {Error} error Object with error details
 */
define('handler', 'error', function (error) {
	this.logger.warn(error.toString());

	switch (this.view) {
		case 'html':
			this.body = error.message;
			break;

		case 'json':
		case 'jsonp':
			this.stash.json = {
				error: {
					message: error.message
				}
			};
			break;
	}

	this.code = this.code || 500;
});


/* Remove default actions on newListener event */
(function (events) {
	var listener = function (event) {
		var i = events.indexOf(event);

		if (~i) {
			events.splice(i, 1);
			this.removeListener(event, (this.listeners(event))[0]);
		}

		if (!events.length) {
			this.removeListener('newListener', listener);
		}
	};

	define('handler', 'newListener', listener);
}(['auto', 'error', 'default']));
