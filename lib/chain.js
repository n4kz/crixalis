'use strict';

/**
 * Class represents action chain. All actions meant to be async, so
 * to move towards chain end action should call `forward` method. Chain
 * length can be changed dynamically after first `forward` call.
 * @class Chain
 * @constructor
 */
function Chain () {
	if (!this instanceof Chain) {
		return new Chain();
	}

	/**
	 * Action queue
	 * @property queue
	 * @type Array
	 */
	this.queue   = [];

	this.lock    = true;
	this.forward = forward.bind(this);

	/**
	 * Results returned by previous actions
	 * @property results
	 * @type Array
	 */
	this.results = [];

	/**
	 * Function to be called when action calls forward with error
	 * @property error
	 * @required
	 * @type Function
	 */
	this.error = null;

	/**
	 * Chain will be extended in async way
	 * @property async
	 * @type Boolean
	 * @default false
	 */
	this.async = false;
}

Chain.prototype = {
	append : append,
	clean  : clean
};

/**
 * Plan next action in chain
 * @method append
 * @param {Function} action Next action in chain
 * @param {Object} context Action context
 * @param {Array} data Arguments to be passed to action
 * @chainable
 */
function append (action, context, data) {
	if (!this.queue) {
		return this;
	}

	this.queue.push({
		fn      : action,
		data    : data    || [],
		context : context || null
	});

	return this;
}

/**
 * Break references on exit to prevent memory leaks.
 * After clean action chain is broken and there is no way to get it back
 * @method clean
 * @chainable
 */
function clean () {
	var property;

	for (property in this) {
		this[property] = null;
	}

	return this;
}

/**
 * Moves to one step forward and executes planned action. If queue
 * is drained - cleans chain. Method is bounded to chain and passed to
 * all actions as last argument.
 * @method forward
 * @param {Error} [error] If defined than error method is called and chain cleaned
 * @param {Object} [result] Result to push into results stack
 * @chainable
 */
function forward (error, result) {
	var action;

	if (!this.queue) {
		return this;
	}

	if (error) {
		if (this.error) {
			this.error(error);
		}

		this.clean();
		return this;
	}

	if (this.lock) {
		/* Do not add result from initial call */
		this.lock = false;
	} else {
		this.results.push(result);
	}

	action = this.queue.shift();

	if (!action) {
		/* Queue drained */
		return this.clean();
	}

	action.data.push(this.forward);

	action.fn.apply(action.context, action.data);

	/* Queue drained */
	if (this.queue && !this.queue.length && !this.async) {
		this.clean();
	}

	return this;
}

module.exports = Chain;
