'use strict';

var properties  = ['methods', 'hosts', 'types', 'async', 'capture'],
	objectified = {
		methods: true,
		hosts: true,
		types: true
	};


/**
 * Route url
 * @property url
 * @type String
 */

/**
 * Route pattern
 * @property pattern
 * @type RegExp
 */

/**
 * Route methods
 * @property methods
 * @type Array
 */

/**
 * Route hosts
 * @property hosts
 * @type Array
 */

/**
 * Route content types
 * @property types
 * @type Array
 */

/**
 * View will be rendered automagically after callback (same as Context#async)
 * @property async
 * @type Boolean
 * @default false
 */

/**
 * Capture map for pattern-based routes
 * @property capture
 * @type Object
 */

function objectify (instance) {
	var object = {}, key, l;

	switch (typeof instance) {
		case 'undefined':
			object = undefined;
			break;
		case 'number':
		case 'string':
			object[instance] = true;
			break;
		default:
			if (typeof instance === 'object' && instance) {
				if (Array.isArray(instance)) {
					l = instance.length;
					while (l--) {
						object[instance[l]] = true;
					}
				} else {
					for (key in instance) {
						if (instance.hasOwnProperty(key)) {
							object[key] = true;
						}
					}
				}
			} else {
				throw new Error('Instace of this type cannot be objectified');
			}
	}

	return object;
}

/**
 * Route class, designed to use with Controller
 * @class Route
 * @param {Controller} controller Controller instance
 * @param {Object} options Route options
 * @constructor
 */
function Route (controller, options) {
	if (!(this instanceof Route)) {
		return new Route(controller, options);
	}

	/**
	 * Controller reference
	 * @property controller
	 * @type Controller
	 */
	this.controller = controller;

	switch (typeof options) {
		case 'undefined':
			break;

		case 'string':
			this.from(options);
			break;

		case 'object':
			if (options instanceof RegExp) {
				this.from(options);
			} else {
				this.set(options);
			}

			break;

		default:
			throw new Error('Unknown options type ' + typeof options);
	}

	return this;
}

/**
 * Add mapping to controller using route object
 * @method to
 * @param {Function} destination Route destination
 * @chainable
 */
Route.prototype.to = function (destination) {
	if (!(this.url || this.pattern)) {
		throw new Error('Nothing to route from');
	}

	if (this.async) {
		console.warn('WARNING: Async routes are deprecated. Use async context');
	}

	switch (typeof destination) {
		case 'function':
			this.controller._route(this, destination);
			break;

		default:
			throw new Error('Unknown destination type');
	}

	return this;
};

/**
 * Set url or pattern depending on source argument type
 * @method from
 * @param source Route source
 * @chainable
 */
Route.prototype.from = function (source) {
	switch (typeof source) {
		case 'string':
			delete this.pattern;
			this.url = source;
			break;

		case 'undefined':
			delete this.url;
			delete this.pattern;
			break;

		default:
			if (!(source instanceof RegExp)) {
				throw new Error('Unknow source type');
			}

			delete this.url;
			this.pattern = source;
	}

	return this;
};

/**
 * Set route properties
 * @method set
 * @param what Property name or object with properties
 * @param [to] Property value
 * @chainable
 */
Route.prototype.set = function (what, to) {
	var args = {},
		property, i, l;

	switch (typeof what) {
		case 'string':
			args[what] = to;
			this.set(args);
			break;
		case 'object':
			for (i = 0, l = properties.length; i < l; i++) {
				property = properties[i];
				if (what.hasOwnProperty(property)) {
					if (objectified[property]) {
						this[property] = objectify(what[property]);
					} else {
						this[property] = what[property];
					}
				}
			}

			if (what.hasOwnProperty('url')) {
				switch (typeof what.url) {
					case 'string':
					case 'undefined':
						this.from(what.url);
						break;
					default:
						throw new Error('Unexpected url type');
				}
			}

			if (what.hasOwnProperty('pattern')) {
				if (!(what.pattern instanceof RegExp)) {
					throw new Error('Pattern must be RegExp');
				}

				this.from(what.pattern);
			}

			break;
		default:
			throw new Error('Wrong parameters');
	}

	return this;
};

/**
 * Unset property or list of properties
 * @method unset
 * @param what What property should be removed
 * @chainable
 */
Route.prototype.unset = function (what) {
	var l;

	switch (typeof what) {
		case 'string':
			delete this[what];
			break;

		default:
			if (!Array.isArray(what)) {
				throw new Error('Wrong parameters');
			}

			l = what.length;
			while (l--) {
				delete this[what[l]];
			}
	}

	return this;
};

/**
 * Test route properties
 * @method match
 * @param {Context} context Check context to match route rules
 * @return {Boolean} Match result
 */
Route.prototype.match = function (context) {
	var captures, i, l, k, ctypes, type, types, params,
		has = Object.prototype.hasOwnProperty;

	if (typeof context !== 'object' || context === null) {
		throw new Error('Expecting object');
	}

	/* Method */
	if (this.methods && !has.call(this.methods, context.method)) {
		return false;
	}

	/* Host */
	if (this.hosts && !has.call(this.hosts, context.host)) {
		// TODO: RegExp match for hosts
		return false;
	}

	/* Pattern match */
	if (this.pattern) {
		if (!context.url) {
			return false;
		}

		captures = context.url.match(this.pattern);

		if (!captures) {
			return false;
		}

		if (!has.call(context, 'params')) {
			context.params = {};
		}

		params = context.params;

		/* Map captured to params */
		for (i = 0, l = captures.length; i < l; i++) {
			k = '$' + (i + 1);
			params[k] = RegExp[k];

			if (this.capture[k]) {
				params[this.capture[k]] = RegExp[k];
			}
		}
	}

	/* Content-type */
	if (this.types) {
		ctypes = context.types || [];
		types = Object.keys(this.types).map(function ($_) {
			return $_.split('/')[0];
		});

		for (i = 0, l = ctypes.length; i < l; i++) {
			type = ctypes[i];

			/*
			 * Match any type
			 */
			if (type === '*/*') {
				return true;
			}

			/*
			 * Match type/subtype
			 */
			if (has.call(this.types, type)) {
				return true;
			}

			/*
			 * Match type/*
			 */
			if (type.match(/\/\*$/) && types.indexOf(type.split('/')[0]) >= 0) {
				return true;
			}
		}

		return false;
	}

	return true;
};

/**
 * Create route copy
 * @method copy
 * @return {Route} Route copy
 */
Route.prototype.copy = function () {
	var that = new Route(this.controller, this),
		source = this.url || this.pattern;

	if (source) {
		that.from(source);
	}

	return that;
};

module.exports = Route;
