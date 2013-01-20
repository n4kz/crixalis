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
	 * Registered url-based routes
	 * @private
	 * @property _routes
	 * @type Object
	 */
	this._routes = {};

	/**
	 * Registered pattern-based routes
	 * @private
	 * @property _patterns
	 * @type Array
	 */
	this._patterns = [];

	/**
	 * Default view. Should be one of the
	 * available views: json, jsonp, html, redirect
	 * @property view
	 * @type String
	 * @default html
	 */
	this.view = 'html';

	/**
	 * Views storage
	 * @private
	 * @property _views
	 * @type Object
	 */
	this._views = {
		json: function () {
			this.headers['Content-Type'] = 'application/json';
			this.body = JSON.stringify(this.stash.json);
		},

		jsonp: function () {
			this.headers['Content-Type'] = 'application/javascript';
			this.body = this.params.callback + '(' + JSON.stringify(this.stash.json) + ');';
		},

		html: function () {
			this.headers['Content-Type'] = 'text/html';
		},

		redirect: function () {
			this.body = '';
			this.code = 302;
			this.headers['Location'] = this.stash.url;
		}
	};

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

	Controller.prototype = proto;
}(require('events').EventEmitter));


/*
 * Methods
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
			header, data, field;

		res.statusCode = this.code || 200;

		if (this.signature) {
			headers['X-Powered-By'] = this.signature;
		}

		for (header in headers) {
			if (has.call(headers, header)) {
				data = headers[header];
				/* TODO: quoted strings */
				if (Array.isArray(data)) {
					res.setHeader(header, data.join('; '));
				} else {
					res.setHeader(header, data);
				}
			}
		}

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
		}

		return this;
	})

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
	 * Transform context using selected view and send
	 * data to client
	 * @method render
	 * @param {String} [view] View name
	 * @chainable
	 */
	._('render', function (view) {
		var fn = this._views[view || this.view];

		/* Throw view errors if any */
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
	})

	/**
	 * Emit error event
	 * @method error
	 * @param {Error} error Error object
	 * @chainable
	 */
	._('error', function (error) {
		this.emit('error', error);
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

		properties = properties || {};

		if (!properties.hasOwnProperty('name')) {
			return this;
		}

		header += properties.name;
		header += '=';
		header += properties.value;
		header += '; domain=';
		header += properties.domain || this.host;

		if (properties.hasOwnProperty('path')) {
			header += '; path=';
			header += properties.path;
		}

		if (properties.hasOwnProperty('expires')) {
			header += '; expires=';
			if (properties.expires instanceof Date) {
				header += properties.expires.toUTCString();
			} else {
				header += properties.expires;
			}
		}

		if (properties.hasOwnProperty('trail')) {
			header += '; ';
			header += properties.trail;
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
		this.render();
	})

	/**
	 * Fired when error occured
	 * @event error
	 * @param {Error} error Object with error details
	 */
	.$('error', function (error) {
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

			default:
				console.log(error.toString());
		}

		this.code = this.code || 500;
		this.render();
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
