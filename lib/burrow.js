'use strict';

/**
 * Class represents action chain. All actions meant to be async, so
 * to move towards burrow end action should call forward method. Burrow
 * length can be changed dynamically after first forward was called.
 * @class Burrow
 * @constructor
 */
function Burrow () {
	if (!this instanceof Burrow) {
		return new Burrow();
	}

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
}

/**
 * Plan next action in chain
 * @method tunnel
 * @param {Function} action Next action in chain
 * @param {Object} context Action context
 * @param {Array} data Arguments to be passed to action
 * @chainable
 */
Burrow.prototype.tunnel = function (action, context, data) {
	if (!this.queue) {
		return this;
	}

	this.queue.push({
		fn      : action,
		data    : data,
		context : context || null
	});

	return this;
};

/**
 * Break references on exit to prevent memory leaks.
 * After clean action chain is broken and there are no way to get it back
 * @method clean
 * @chainable
 */
Burrow.prototype.clean = function () {
	var has = Object.prototype.hasOwnProperty,
		property;

	for (property in this) {
		if (has.call(this, property)) {
			delete this[property];
		}
	}

	return this;
};

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

	if (action.data) {
		action.data.push(this.forward);
	}

	action.fn.apply(action.context, action.data);

	/* Remove references */
	delete action.fn;
	delete action.context;
	delete action.data;

	return this;
}

module.exports = Burrow;