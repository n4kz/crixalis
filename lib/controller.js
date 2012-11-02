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
	 * Method returns new route object
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
		var header, value,
			headers = this.headers;

		this.res.statusCode = this.code || 200;

		if (!headers['Content-Encoding']) {
			headers['Content-Encoding'] = 'utf8';
		}

		for (header in headers) {
			if (headers.hasOwnProperty(header)) {
				value = headers[header];
				switch (typeof value) {
					case 'object':
						// TODO: arrays
						break;
					default:
						this.res.setHeader(header, String(value));
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

		if (typeof loader !== 'function') {
			throw new Error('Plugin returned unexpected value');
		}

		loader.call(this, options);
		return this;
	})

	/**
	 * Select best route
	 * @method select
	 * @chainable
	 */
	._('select', function () {
		var queue = this._routes[this.url],
			async = false,
			patts = false,
			i, l;

		if (!(Array.isArray(queue))) {
			patts = true;
			queue = this._patterns;
		}

		l = queue.length;
		while (i < l) {
			/* Route matches */
			if (queue[i].route.match(this)) {
				/* Syncronous */
				if (queue[i].callback.call(this)) {
					this.emit('end');
					return this;
				}

				/* Update async flag */
				async = queue[i].route.async || this.async;

				/* Stop cheking if async callback found */
				if (async) {
					break;
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
	 * Add new route
	 * @method route
	 * @param {Route} route Route object to add
	 * @param {Function} callback Function to be called when route matches
	 * @chainable
	 */
	._('route', function (route, callback) {
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
	 * @type Object
	 */
	._('_patterns', {})

	/**
	 * Default view
	 * @property view
	 * @type String
	 * @default html
	 */
	._('view', 'html')

	/*
	 * Default views
	 * false means 'end' will be called automagically
	 */
	._('views', {
		json: function () {
			this.headers['Content-Type'] = 'application/json';
			this.body = JSON.stringify(this.stash.json);
			return false;
		},

		html: function () {
			this.headers['Content-Type'] = 'text/html';
			return false;
		}
	});


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
				this.view = this.views[this.view];
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
			this.res.setHeader('Content-Length', Buffer.byteLength(this.body));
		}

		/* Write headers */
		this.sendHeaders();

		/* Write body */
		if (this.body && !this.is_head) {
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

	/**
	 * Fired when new route added
	 * @event route
	 */

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
