'use strict';

/**
 * Lightweight web framework
 * @module Crixalis
 */

var Route   = require('./route'),
	Context = require('./context'),
	events  = require('events'),
	plugins = ['request', 'static', 'compression', 'shortcuts', 'access', 'core'];

/**
 * @class Crixalis
 * @constructor
 */
function Crixalis () {
	if (!(this instanceof Crixalis)) {
		return new Crixalis();
	}

	var self     = this,
		routes   = [],
		views    = Object.create(null),
		features = Object.create(null);

	/**
	 * Extend Crixalis instance with property, method, view or feature
	 * @method define
	 * @param {String} name Property name
	 * @param {Any} value Property value
	 * @param {Object} descriptor Descriptor for Object.defineProperty()
	 * @chainable
	 */
	function define (name, value, descriptor) {
		var target = self;

		descriptor            = descriptor || {};
		descriptor.value      = value      || {};
		descriptor.enumerable = typeof value !== 'function';

		if (/^(view|feature)::(\w+)$/.exec(name)) {
			name   = RegExp.$2;
			target = { view: views, feature: features }[RegExp.$1];
		}

		Object.defineProperty(target, name, descriptor);

		return this;
	}

	define('define', define);

	/**
	 * Load plugin
	 * @method plugin
	 * @param {String} plugin Plugin name
	 * @param {Object} options Options for plugin loader
	 * @chainable
	 */
	this.define('plugin', function (plugin, options) {
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
	 * Create new route and add to controller
	 * @method route
	 * @param {String|RegExp} source Route source
	 * @param {Object} [options] Route options
	 * @param {Function} callback Route destination
	 * @chainable
	 */
	this.define('route', function (source, options, callback) {
		if (arguments.length == 2) {
			callback = options,
			options  = undefined;
		}

		if (typeof callback !== 'function') {
			throw new Error('Callback must be a function');
		}

		routes.push([transformRoute(new Route(source, options)), callback]);

		return this;
	});

	/**
	 * Select matching route. Method should be called in __auto__ event handler.
	 *
	 *     Crixalis.on('auto', function () {
	 *         console.log(this.method + ' ' + this.url);
	 *
	 *         this.select();
	 *     });
	 *
	 * @method select
	 */
	this.define('select', function () {
		var i, l;

		for (i = 0, l = routes.length; i < l; i++) {
			/* Route matches */
			if (routes[i][0].match(this)) {
				/* Execute route callback */
				if (routes[i][1].call(this) === false) {
					/* Go to next route */
					continue;
				}

				return;
			}
		}

		/* Nothing matched */
		this.error(404);
	});

	/**
	 * Transform context using selected view and send data to client
	 * @method render
	 * @param {String} [view] View name
	 */
	this.define('render', function (view) {
		var fn = views[view || 'auto'];

		if (typeof fn === 'function') {
			if (fn.call(this) === false) {
				/* Async view */
				return;
			}
		} else {
			throw new Error('Unsupported view ' + view);
		}

		if (this.body && this.has('compression')) {
			/**
			 * Emitted when compression should be applied to response data
			 * @event compression
			 */
			this.emit('compression');
		} else {
			this.sendResponse();
		}
	});

	/**
	 * Create new Context with provided request and response objects
	 * @method createContext
	 * @param {Object} request
	 * @param {Object} response
	 * @return {Context}
	 */
	this.define('createContext', function (request, response) {
		Context.prototype = this;

		return new Context(request, response);
	});

	/**
	 * Check if feature is present
	 * @method has
	 * @return {Boolean}
	 */
	this.define('has', function (feature) {
		return feature in features;
	});

	/**
	 * Fired when context is ready for route selection
	 * @event auto
	 */
	this.on('auto', function () {
		this.select()
	});

	/**
	 * Fired when error occured
	 * @event error
	 * @param {Error} error Object with error details
	 */
	this.on('error', function (error) {
		var types = this.types,
			i, l;

		this.logger.error(error);

		for (i = 0, l = types.length; i < l; i++) {
			switch (types[i]) {
				case 'application/json':
					this.stash.json = {
						error: {
							message: error.message
						}
					};
					break;

				case '*/*':
				case 'text/*':
				case 'text/html':
					this.body = error.message;
					break;

				default:
					continue;
			}

			/* Type found */
			break;
		}

		if (i === l) {
			/* Not acceptable, treat as html */
			this.body = error.message;
		}

		this.code = this.code || 500;
		this.render();
	});

	/* Remove default actions on newListener event */
	setupDefaultListeners(this, ['auto', 'error']);

	/* Load core methods */
	this.plugin('core');

	return this;
}

Crixalis.prototype = Object.create(events.EventEmitter.prototype, {
	constructor: { value: Crixalis },

	/**
	 * Crixalis version
	 * @property version
	 * @type String
	 */
	version: { value: require('../package').version, enumerable: true },

	/**
	 * Server signature, visible in X-Powered-By header
	 * @property signature
	 * @type String
	 * @default Crixalis
	 */
	signature: { value: 'Crixalis', enumerable: true, writable: true },

	/**
	 * Maximum POST body size in bytes
	 * @property postSize
	 * @type Number
	 * @default 1048576
	 */
	postSize: { value: 1048576, enumerable: true, writable: true },

	/**
	 * Default logger
	 * @property logger
	 * @type Object
	 */
	logger: { value: console, enumerable: true, writable: true },

	/**
	 * Response code
	 * @property code
	 * @type Number
	 */
	code: { value: 0, enumerable: true, writable: true },

	/**
	 * Response body
	 * @property body
	 * @type String
	 */
	body: { value: '', enumerable: true, writable: true }
});

function setupDefaultListeners (emitter, events) {
	events.forEach(function (defaultEvent) {
		function handleNewListener (event) {
			if (defaultEvent === event) {
				emitter.removeListener(event, (emitter.listeners(event))[0]);
				emitter.removeListener('newListener', handleNewListener);
			}
		}

		emitter.on('newListener', handleNewListener);
	});
}

function transformRoute (route, callback) {
	var i = 1;

	if (route.url) {
		route.mapping = Object.create(null);

		route.pattern = new RegExp('^' + route.url.split(/([:]\w+|[*])/).map(function (part) {
			if (part[0] === ':') {
				route.mapping['$' + i++] = part.slice(1);

				return '([^/.]+)';
			} else if (part === '*') {
				return '(?:.+)';
			}

			return part.replace(/[\/()\[\]{}?^$+*.,]/g, function (char) { return '\\' + char });
		}).join('') + '$', 'i');

		route.unset('url');
	}

	if (!(route.pattern instanceof RegExp)) {
		throw new Error('Nothing to route');
	}

	return route;
}

module.exports = Crixalis;
