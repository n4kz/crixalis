'use strict';

/**
 * Lightweight node.js controller
 * @module Crixalis
 */

var Route        = require('./route'),
	Context      = require('./context');

/**
 * @class Controller
 * @constructor
 */
function Controller() {
	if (!(this instanceof Controller)) {
		return new Controller();
	}

	/* Hide helpers */
	this.$ = this.noop;
	this._ = this.noop;

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
	 * Method returns closure for handling incoming requests
	 * @method handler
	 * @return {Function} Handler for http.createServer()
	 */
	._('handler', function () {
		return Context.bind(undefined, this);
	})

	/**
	 * Method writes headers out
	 * @method sendHeaders
	 * @chainable
	 */
	._('sendHeaders', function () {
		var header, data, field,
			res = this.res,
			headers = this.headers;

		res.statusCode = this.code || 200;

		if (this.signature) {
			headers['X-Powered-By'] = this.signature;
		}

		for (header in headers) {
			if (headers.hasOwnProperty(header)) {
				data = headers[header];
				/* TODO: quoted strings */
				if (Array.isArray(data)) {
					res.setHeader(header, data.join('; '));
				} else {
					res.setHeader(header, String(data));
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
		var loader = require(plugin);
		/* TODO: modify path resolution logic */

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
					this.emit('end');
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
	 * @chainable
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

		/**
		 * Fired when new route added
		 * @event route
		 */
		this.emit('route', route);
		return this;
	})

	/**
	 * Emit end signal
	 * @method render
	 * @chainable
	 */
	._('render', function () {
		this.emit('end');
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
		this.stash.url = String(url);
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
	 * Empty function
	 * @method noop
	 * @return {Function} Function that does nothing
	 */
	._('noop', function () { return this; });


/*
 * Properties
 */
Controller

	/**
	 * Registered url-based routes
	 * @private
	 * @property _routes
	 * @type Object
	 */
	._('_routes', {})

	/**
	 * Registered pattern-based routes
	 * @private
	 * @property _patterns
	 * @type Array
	 */
	._('_patterns', [])

	/**
	 * Default view. Should be one of the
	 * available views: json, jsonp, html, redirect
	 * @property view
	 * @type String
	 * @default html
	 */
	._('view', 'html')

	/**
	 * Views storage
	 * @private
	 * @property _views
	 * @type Object
	 */
	._('_views', {
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
	})

	/**
	 * Server signature, X-Powered-By header
	 * @property signature
	 * @type String
	 * @default Crixalis
	 */
	._('signature', 'Crixalis');


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
		this.emit('end');
	})

	/**
	 * Fired when error occured
	 * @event error
	 * @param {Error} error Object with error details
	 */
	.$('error', function (error) {
		var message;

		if (error instanceof Error) {
			message = error.message;
		}

		this.code = this.code || 500;
		this.body = message;

		this.emit('end');
	})

	/**
	 * Fired when request ended and data is ready
	 * to be sent to client. Data format depends on this.view
	 * @event end
	 */
	.$('end', function () {
		/* Select best view */
		switch (typeof this.view) {
			case 'function':
				/* Leave function as is */
				break;

			case 'string':
				/* Try to find appropriate view */
				this.view = this._views[this.view];
				break;
		}

		/* Throw view errors if any */
		switch (typeof this.view) {
			case 'function':
				if (this.view.call(this)) {
					/* Nothing to do with async view */
					return;
				}
				break;

			case 'string':
				throw new Error('Unsupported view ' + this.view);

			default:
				if (this.view instanceof Error) {
					throw this.view;
				}

				throw new Error('Unsupported view type ' + typeof this.view);
		}

		/* Write Content-Length */
		if (this.body) {
			this.headers['Content-Length'] = Buffer.byteLength(this.body);
		}

		/* Write headers */
		this.sendHeaders();

		/* Write body */
		if (this.hasOwnProperty('body') && !this.is_head) {
			this.res.write(this.body);
		}

		/* End request */
		this.emit('destroy');
	})

	/**
	 * Destroy context and break references
	 * Also end request
	 * @event destroy
	 */
	.$('destroy', function () {
		this.res.end();
		/* TODO: change clean logic */
		this.clean();
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

module.exports = Controller;
