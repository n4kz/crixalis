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

			features: ->
				assert.isFalse Crixalis.has('compression')
				assert.isFalse Crixalis.has('static')
				assert.isFalse Crixalis.has('test')

				Crixalis.define('feature::test')

				assert.isTrue Crixalis.has('test')
				assert.throws ->
					Crixalis.define('feature::test')

			views: ->
				assert.doesNotThrow -> Crixalis.define('view::xml', ->)

				assert.throws -> Crixalis.define('view::xml', ->)
				assert.throws -> Crixalis.define('view::auto', ->)

		instance:
			topic: ->
				constructor = require('../lib/crixalis')
				instance    = new constructor

				instance.define('feature::namespace')
				instance.define('view::empty', ->)

				@callback null, instance

			features: (instance) ->
				assert.isTrue  instance.has('namespace')
				assert.isFalse Crixalis.has('namespace')

			views: (instance) ->
				assert.throws       -> instance.define('view::empty', ->)
				assert.doesNotThrow -> Crixalis.define('view::empty', ->)

			inheritance: (instance) ->
				assert.instanceOf instance, Crixalis.constructor
				assert.instanceOf instance, EventEmitter

			constructor: (instance) ->
				assert.equal instance.constructor, Crixalis.constructor
				assert.equal instance.constructor, require('../lib/crixalis')

			reference: (instance) ->
				assert.notEqual Crixalis, instance

	.export(module)
