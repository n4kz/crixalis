assert       = require('assert')
Crixalis     = require('../lib/controller.js')
EventEmitter = require('events').EventEmitter

(require 'vows')
	.describe('params')
	.addBatch
		require:
			topic: null

			constructor: ->
				assert.instanceOf Crixalis, Crixalis.constructor
				assert.instanceOf Crixalis, EventEmitter

			properties: ->
				assert.equal Crixalis.version, require('../package').version
				assert.equal Crixalis.signature, 'Crixalis'
				assert.equal Crixalis.postSize, 1 << 20
				assert.equal Crixalis.view, 'html'
				assert.equal Crixalis.code, 0
				assert.equal Crixalis.body, ''
				assert.equal Crixalis.logger, console

			methods: ->
				methods = [
					'createContext',
					'route',
					'sendHeaders',
					'plugin',
					'select',
					'render',
					'error',
					'redirect',
					'cookie',
					'define',
					'start'
				]

				for method in methods
					assert.isFunction Crixalis[method]

			private: ->
				assert.isObject   Crixalis._views
				assert.isArray    Crixalis._routes
				assert.isFunction Crixalis._route
				assert.isFunction Crixalis._response
				assert.isFunction Crixalis._destroy

	.export module
