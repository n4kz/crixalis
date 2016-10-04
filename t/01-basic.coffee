assert       = require 'assert'
EventEmitter = require('events').EventEmitter
Crixalis     = require '../lib'

(require 'vows')
	.describe('params')
	.addBatch
		require:
			topic: null

			inheritance: ->
				assert.instanceOf Crixalis, Crixalis.constructor
				assert.instanceOf Crixalis, EventEmitter

				assert.isFalse Crixalis.propertyIsEnumerable('constructor')

			constructor: ->
				assert.equal Crixalis.constructor, require('../lib/crixalis')

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
					# Protected
					'define',
					'plugin',
					'route',
					'select',
					'render',
					'createContext',
					'has',

					# Private
					'destroyContext',
					'sendResponse',

					# Public
					'sendHeaders',
					'error',
					'start',
					'cookie',
					'redirect'
				]

				for method in methods
					assert.isFunction Crixalis[method]
					assert.isFalse Crixalis.propertyIsEnumerable(method)

			events: ->
				events = [
					'auto',
					'error',
					'newListener'
				]

				for event in events
					assert.isArray Crixalis.listeners(event)

			define: ->
				property = Object.create(null)
				method   = new Function()

				Crixalis.define('property', property)
				Crixalis.define('method', method)

				assert.isFunction Crixalis.method
				assert.isFalse    Crixalis.propertyIsEnumerable('method')
				assert.equal      Crixalis.method, method

				assert.isObject Crixalis.property
				assert.isTrue   Crixalis.propertyIsEnumerable('property')
				assert.equal    Crixalis.property, property

	.export(module)
