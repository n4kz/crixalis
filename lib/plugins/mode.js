'use strict';

/**
 * Mode plugin.
 * Provides mode flag (local/production)
 *
 *     Crixalis
 *         .plugin('mode');
 *
 *     if (Crixalis.local) {
 *         ...
 *     }
 *
 * @module Crixalis
 * @submodule shortcuts
 * @for Controller
 */

var Crixalis = require('../controller');

module.exports = function (variable) {
	var local = process.env[variable || 'NODE_ENV'] === 'production';

	Crixalis.define('property', 'local', local, { writable: false });
};
