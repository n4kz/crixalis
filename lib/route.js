'use strict';

var properties  = ['methods', 'hosts', 'types', 'mapping'],
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
 * Mapping for captured URL parts
 * @property mapping
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
function Route (source, options) {
	if (!(this instanceof Route)) {
		return new Route(controller, options);
	}

	this.from(source);

	if (options) {
		this.set(options);
	}

	return this;
}

/**
 * Set url or pattern depending on source argument type
 * @method from
 * @param {String|RegExp} source Route source
 * @chainable
 */
Route.prototype.from = function (source) {
	switch (typeof source) {
		case 'string':
			this.url = source;
			this.unset('pattern');
			break;

		case 'undefined':
			this.unset(['url', 'pattern']);
			break;

		case 'object':
			if (source instanceof RegExp) {
				this.pattern = source;
				this.unset('url');

				break;
			}

		default:
			throw new Error('Unknow source type');
	}

	return this;
};

/**
 * Set route properties
 * @method set
 * @param {Object} options Object with properties
 * @chainable
 */
Route.prototype.set = function (options) {
	var name, i, l;

	if (typeof options !== 'object' || options === null) {
		throw new Error('Expected object');
	}

	for (i = 0, l = properties.length; i < l; i++) {
		name = properties[i];

		if (options.hasOwnProperty(name)) {
			if (objectified[name]) {
				this[name] = objectify(options[name]);
			} else {
				this[name] = options[name];
			}
		}
	}

	return this;
};

/**
 * Unset property or list of properties
 * @method unset
 * @param {String|Array} options Property name or array with names
 * @chainable
 */
Route.prototype.unset = function (options) {
	switch (typeof options) {
		case 'string':
			delete this[options];
			break;

		case 'object':
			if (Array.isArray(options)) {
				while (options.length) {
					this.unset(options.shift());
				}

				break;
			}

		default:
			throw new Error('String or array expected');
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
	var captures, i, l, k, ctypes, type, types;

	if (typeof context !== 'object' || context === null) {
		throw new Error('Expecting object');
	}

	/* Method */
	if (this.methods && !(context.method in this.methods)) {
		return false;
	}

	/* Host */
	if (this.hosts && !(context.host in this.hosts)) {
		return false;
	}

	/* URL */
	if (this.url) {
		if (context.url !== this.url) {
			return false;
		}
	}

	/* Pattern match */
	if (this.pattern) {
		captures = this.pattern.exec(context.url);

		if (!captures) {
			return false;
		}

		/* Map captured parametes */
		for (i = 1, l = captures.length; i < l; i++) {
			k = '$' + i;

			if (k in this.mapping) {
				k = this.mapping[k];
			}

			context.params[k] = captures[i];
		}
	}

	/* Content-type */
	if (this.types) {
		ctypes = context.types || [];
		types  = [];

		for (type in this.types) {
			types.push(type.split('/')[0]);
		}

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
			if (type in this.types) {
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

module.exports = Route;
