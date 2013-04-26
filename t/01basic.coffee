assert = require 'assert'
c      = require '../lib/controller.js'
ee     = require('events').EventEmitter

(require 'vows')
	.describe('params')
	.addBatch
		require:
			topic: null

			constructor: ->
				assert.instanceOf c, c.constructor
				assert.instanceOf c, ee

			context: ->
				assert.isFunction c.handler
				assert.equal c, c.handler.prototype

			properties: ->
				assert.equal c.version, require('../package').version
				assert.equal c.signature, 'Crixalis'
				assert.equal c.postSize, 1 << 20
				assert.equal c.view, 'html'
				assert.equal c.code, 0
				assert.equal c.body, ''

			methods: ->
				for method in 'router sendHeaders plugin select render error redirect cookie burrow noop define'.split(' ')
					assert.isFunction c[method]

			private: ->
				assert.isObject   c._views
				assert.isObject   c._routes
				assert.isArray    c._patterns
				assert.isFunction c._route
				assert.isFunction c._response
				assert.isFunction c._destroy

	.export module
