assert = require 'assert'
vows   = require 'vows'
Route  = require '../lib/route'

vows
	.describe('route')
	.addBatch
		constructor:
			empty: ->
				assert.instanceOf((new Route), Route)

			string: ->
				route = new Route url = '/test'

				assert.instanceOf route, Route
				assert.equal typeof route.url, 'string'
				assert.equal route.url, url

			pattern: ->
				route = new Route pattern = /\/test/

				assert.instanceOf route, Route
				assert.equal route.pattern, pattern

			options: ->
				route = new Route pattern = /\/test/, options = methods: ['GET']

				assert.instanceOf route, Route
				assert.equal route.pattern, pattern
				assert.deepEqual route.methods, GET: yes

		from:
			string: ->
				(route = new Route)
					.from url = '/test/'

				assert.equal route.url, url

			pattern: ->
				(route = new Route)
					.from pattern = /test/

				assert.equal route.pattern, pattern

			invalid: ->
				route = new Route

				assert.throws -> route.from null
				assert.throws -> route.from {}
				assert.throws -> route.from []
				assert.throws -> route.from ->

			undefined: ->
				(route = new Route '/')
					.from()

				assert.isUndefined route.url
				assert.isUndefined route.pattern

		set:
			invalid: ->
				route = new Route

				assert.throws -> route.set null
				assert.throws -> route.set ->

				assert.throws -> route.set methods: null
				assert.throws -> route.set methods: ->

			array: ->
				(route = new Route)
					.set methods: ['HEAD', 'POST']

				assert.isObject route.methods

				assert.isTrue route.methods.POST
				assert.isTrue route.methods.HEAD

			undefined: ->
				(route = new Route)
					.set methods: ['HEAD', 'POST']
					.set methods: undefined

				assert.isUndefined route.methods

		unset:
			string: ->
				(route = new Route '/')
					.unset 'url'

				assert.isUndefined route.url

			array: ->
				(route = new Route '/', methods: ['GET', 'POST'])
					.unset ['url', 'methods']

				assert.isUndefined route.url
				assert.isUndefined route.methods

			null: ->
				assert.throws -> new Route.unset null

			undefined: ->
				assert.throws -> new Route.unset()

			object: ->
				assert.throws -> new Route.unset methods: yes

		match:
			null: ->
				assert.throws -> new Route.match null

			empty: ->
				route = new Route

				# Empty route always matches
				assert.isTrue route.match {}
				assert.isTrue route.match method: 'HEAD'
				assert.isTrue route.match host: 'localhost'

			method: ->
				route = new Route undefined, methods: ['GET', 'POST']

				assert.isTrue route.match method: 'GET'
				assert.isTrue route.match method: 'POST'

				assert.isFalse route.match {}
				assert.isFalse route.match method: 'HEAD'
				assert.isFalse route.match host: 'localhost'

			host: ->
				route = new Route undefined, hosts: ['microsoft.com', 'apple.com', 'kernel.org']

				assert.isTrue route.match host: 'microsoft.com'
				assert.isTrue route.match host: 'apple.com'
				assert.isTrue route.match host: 'kernel.org'

				assert.isFalse route.match {}
				assert.isFalse route.match { method: 'HEAD' }
				assert.isFalse route.match { host: 'localhost' }

			pattern: ->
				route = new Route /\/test\/123|456\/ok/

				assert.isTrue  route.match url: '/test/123/ok'
				assert.isFalse route.match url: '/test/761/ok'
				assert.isFalse route.match url: '/test'

			mapping: ->
				route = new Route /\/test\/(123|456)\/ok/,
					mapping:
						$1: 'number'

				assert.isTrue route.match url: '/test/123/ok', params: {}
				assert.isTrue route.match url: '/test/456/ok', params: {}
				assert.isTrue route.match url: '/test/456/ok', method: 'GET', params: {}

				assert.isFalse route.match params: {}
				assert.isFalse route.match hostname: 'localhost', params: {}
				assert.isFalse route.match url: '/test/13/ok', params: {}
				assert.isFalse route.match url: 'test/456/ok', params: {}

				context =
					params: {}
					url: '/test/123/ok'

				assert route.match context
				assert.equal context.params.number, '123'
				assert.isUndefined context.params.$1
				assert.isUndefined context.params.$2

				context =
					params: {}
					url: '/test/456/ok'

				route.set
					mapping:
						$1: 'test'

				assert route.match context
				assert.equal context.params.test, '456'

				assert.isUndefined context.params.number
				assert.isUndefined context.params.$1
				assert.isUndefined context.params.$2

			types: ->
				route = new Route undefined, types: ['text/html', 'text/text']

				assert.isTrue route.match types: ['text/html']
				assert.isTrue route.match types: ['text/text']
				assert.isTrue route.match types: ['html/html', 'text/text']
				assert.isTrue route.match types: ['text/text', 'html/html']
				assert.isTrue route.match types: ['text/text', 'text/html']
				assert.isTrue route.match types: ['text/*']
				assert.isTrue route.match types: ['text/plain', '*/*']

				assert.isFalse route.match types: []
				assert.isFalse route.match types: ['application/*']
				assert.isFalse route.match types: ['application/json']
				assert.isFalse route.match types: ['application/json', 'html/html']

	.export module
