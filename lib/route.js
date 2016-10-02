'use strict';

var properties = ['methods', 'hosts', 'types', 'mapping'];

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

function createMap (item) {
	var hash = Object.create(null),
		key, l;

	switch (typeof item) {
		case 'undefined':
			return;

		case 'number':
		case 'string':
			hash[item] = true;
			break;

		default:
			if (Array.isArray(item)) {
				item.forEach(function (key) { hash[key] = true });
			} else {
				throw new Error('Invalid value');
			}
	}

	return hash;
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
	if (!options || typeof options !== 'object') {
		throw new Error('Expected object');
	}

	properties
		.forEach(function (property) {
			if (options.hasOwnProperty(property)) {
				if (property === 'mapping') {
					this[property] = options[property];
				} else {
					this[property] = createMap(options[property]);
				}
			}
		}.bind(this));

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

		default:
			if (Array.isArray(options)) {
				while (options.length) {
					this.unset(options.shift());
				}
			} else {
				throw new Error('String or array expected');
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
	var captures, i, l, k, type, subtype;

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

	/* Content-Type */
	if (this.types && context.message) {
		if (!/^(.+)\/(.+)$/.exec(context.message.type)) {
			return false;
		}

		type    = RegExp.$1;
		subtype = RegExp.$2;

		if (!('*/*' in this.types || type + '/*' in this.types || type + '/' + subtype in this.types)) {
			return false;
		}
	}

	return true;
};

module.exports = Route;
