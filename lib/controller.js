'use strict';

/**
 * Lightweight web framework
 * @module Crixalis
 */

var Route   = require('./route'),
	Context = require('./context'),
	Burrow  = require('./burrow'),
	plugins = 'static compression processor coffee less jade'.split(' ');

/**
 * @class Controller
 * @constructor
 */
function Controller() {
	if (!(this instanceof Controller)) {
		return new Controller();
	}

	Context.prototype = this;

	/**
	 * Constructor reference for extensions
	 * @property self
	 * @private
	 */
	this.self = Controller;

	/**
	 * Response code
	 * @property code
	 * @type Number
	 */
	this.code = 0;

	/**
	 * Response body
	 * @property body
	 * @type String
	 */
	this.body = '';


	/**
	 * Default view. Should be one of the
	 * available views: json, jsonp, html, redirect
	 * @property view
	 * @type String
	 * @default html
	 */
	this.view = 'html';

	/**
	 * Handler for http.createServer()
	 * @property handler
	 * @type Function
	 */
	this.handler = Context;

	/**
	 * Crixalis version
	 * @property version
	 * @type String
	 */
	this.version = require('../package').version;

	/**
	 * Server signature, X-Powered-By header
	 * @property signature
	 * @type String
	 * @default Crixalis
	 */
	this.signature = 'Crixalis';

	this.is_head = false;
	this.is_post = false;

	return this;
}

(function (Emitter) {
	var proto = new Emitter();

	/*
	 * Helpers
	 */

	/**
	 * Extend Controller.prototype with property or method
	 * @method _
	 * @protected
	 * @param {String} name Property name
	 * @param value Property value
	 * @chainable
	 */
	Controller._ = function (name, value) {
		if (proto.hasOwnProperty(name)) {
			throw new Error('Property ' + name + 'already exists');
		}

		proto[name] = value;
		return this;
	};

	/**
	 * Bind handler on event
	 * @method $
	 * @protected
	 * @param {String} event Event name
	 * @param {Function} handler Event handler
	 * @chainable
	 */
	Controller.$ = function (event, handler) {
		proto.on(event, handler);
		return this;
	};

	/**
	 * Add view to _views
	 * @method _define
	 * @param {String} name
	 * @param {Function} callback
	 * @private
	 * @chainable
	 */
	Controller._define = function (name, callback) {
		if (typeof callback !== 'function') {
			throw new Error('Callback must be a function');
		}

		if (name in proto._views) {
			throw new Error('View already defined');
		}

		proto._views[name] = callback;

		return this;
	};

	Controller.prototype = proto;
}(require('events').EventEmitter));


/*
 * Properties
 */
Controller
	/**
	 * Views storage
	 * @private
	 * @property _views
	 * @type Object
	 */
	._('_views', Object.create(null))

	/**
	 * Registered url-based routes
	 * @private
	 * @property _routes
	 * @type Object
	 */
	._('_routes', Object.create(null))

	/**
	 * Registered pattern-based routes
	 * @private
	 * @property _patterns
	 * @type Array
	 */
	._('_patterns', []);


/*
 * Private Methods
 */
Controller
	/**
	 * Add new route to _routes or _patterns, dependig on route type.
	 * @method _route
	 * @private
	 * @param {Route} route Route object to add
	 * @param {Function} callback Function to be called when route matches
	 */
	._('_route', function (route, callback) {
		var key = route.url || route.pattern;

		if (!(route instanceof Route)) {
			throw new Error('Expecting Route instance');
		}

		if (typeof callback !== 'function') {
			throw new Error('Callback must be a function');
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
			if (!key instanceof RegExp) {
				throw new Error('Nothing to route');
			}

			this._patterns.push({
				route    : route.copy().unset('controller'),
				callback : callback
			});
		}
	})

	/**
	 * Write response to socket and destroy context
	 * @method _response
	 * @private
	 */
	._('_response', function () {
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
	})

	/**
	 * Destroy context
	 * @method _destroy
	 * @private
	 */
	._('_destroy', function () {
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


/*
 * Public Methods
 */
Controller
	/**
	 * Create route object for current controller
	 * @method router
	 * @param {Object} options Options for route constructor
	 * @return {Route} New route object
	 */
	._('router', function (options) {
		return new Route(this, options);
	})

	/**
	 * Method writes headers out
	 * @method sendHeaders
	 * @chainable
	 */
	._('sendHeaders', function () {
		var res     = this.res,
			has     = Object.prototype.hasOwnProperty,
			headers = this.headers,
			header, data, field, i, l;

		if (this.signature) {
			headers['X-Powered-By'] = this.signature;
		}

		for (header in headers) {
			data = headers[header];

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
	})

	/**
	 * Load plugin
	 * @method plugin
	 * @param {String} plugin Plugin name
	 * @param {Object} options Options for plugin loader
	 * @chainable
	 */
	._('plugin', function (plugin, options) {
		var loader;

		if (plugins.indexOf(plugin) !== -1) {
			loader = require('./plugins/' + plugin);
		} else {
			loader = require(plugin);
		}

		if (typeof loader !== 'function') {
			throw new Error('Plugin returned unexpected value');
		}

		loader.call(this, options);
		return this;
	})

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
	._('select', function () {
		var queue = this._routes[this.url],
			async = false,
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
				/* Process user code */
				result = queue[i].callback.call(this);

				/* Update async flag */
				async = queue[i].route.async || this.async;

				/* Stop cheking if async callback found */
				if (async) {
					break;
				}

				/* Syncronous */
				if (result !== false) {
					this.render();
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
		if (!async) {
			this.emit('default');
			this.render();
		}

		return this;
	})

	/**
	 * Transform context using selected view and send
	 * data to client
	 * @method render
	 * @param {String} [view] View name
	 * @chainable
	 */
	._('render', function (view) {
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
	})

	/**
	 * Emit error event
	 * @method error
	 * @param {Error} error Error object
	 * @param {Boolean} [render] Call render() after emitting error
	 * @chainable
	 */
	._('error', function (error, render) {
		this.emit('error', error);

		if (this.async || render) {
			this.render();
		}

		return this;
	})

	/**
	 * Redirect to another url 
	 * @param {String} url Target url
	 * @method redirect
	 * @chainable
	 */
	._('redirect', function (url) {
		this.view = 'redirect';
		this.stash.url = url;
		return this;
	})

	/**
	 * Send Set-Cookie header in response
	 * @param {Object} properties Cookie properties
	 * @method cookie
	 * @chainable
	 */
	._('cookie', function (properties) {
		var headers = this.headers,
			header = '';

		if (typeof properties !== 'object') {
			throw new Error('Object expected');
		}

		if (!properties.name) {
			throw new Error('Cookie name required');
		}

		/* Set HttpOnly by default */
		if (!properties.hasOwnProperty('http')) {
			properties.http = true;
		}

		header += properties.name;
		header += '=';

		if (properties.value === null) {
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
	})

	/**
	 * Create new burrow object
	 * @method burrow
	 * @return {Burrow}
	 */
	._('burrow', function () { return new Burrow() })

	/**
	 * Empty function
	 * @method noop
	 * @return {Function} Function that does nothing
	 * @chainable
	 */
	._('noop', function () { return this; });


/*
 * Events
 */
Controller
	/**
	 * Default auto action
	 * Fired when context is ready for dispatch
	 * @event auto
	 */
	.$('auto', Controller.prototype.select)

	/**
	 * Default action
	 * fired when nothing matches
	 * @event default
	 */
	.$('default', function () {
		this.code = 404;
		this.body = 'Not found';
	})

	/**
	 * Fired when error occured
	 * @event error
	 * @param {Error} error Object with error details
	 */
	.$('error', function (error) {
		console.warn(error.toString());

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

/*
 * Views
 */
Controller
	/* JSON */
	._define('json', function () {
		this.headers['Content-Type'] = 'application/json; charset=utf-8';
		this.body = JSON.stringify(this.stash.json);
	})

	/* Padded JSON */
	._define('jsonp', function () {
		this.headers['Content-Type'] = 'application/javascript; charset=utf-8';
		this.body = this.params.callback + '(' + JSON.stringify(this.stash.json) + ');';
	})

	/* Old plain html */
	._define('html', function () {
		this.headers['Content-Type'] = 'text/html; charset=utf-8';
	})

	/* Redirect to another resource */
	._define('redirect', function () {
		this.body = '';
		this.code = 302;
		this.headers['Location'] = this.stash.url;
	});

/*
 * Remove default actions on newListener event
 */
(function ($) {
	var listener = function (event) {
		var i = $.indexOf(event);

		if (i !== -1) {
			$.splice(i, 1);
			this.removeListener(event, (this.listeners(event))[0]);
		}

		if (!$.length) {
			this.removeListener('newListener', listener);
		}
	};

	Controller.$('newListener', listener);
}(['auto', 'error', 'default']));

module.exports = new Controller();
