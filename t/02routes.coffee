assert = require 'assert'
vows   = require 'vows'
Route  = require '../lib/route.js'

vows
	.describe('routes')
	.addBatch
		Route:
			'new Route(c, \'/test\')': ->
				c = {}
				url = '/test'
				route = new Route c, url

				assert route instanceof Route
				assert.equal typeof route.url, 'string'
				assert.equal route.url, url
				assert.equal route.controller, c
				assert not route.pattern

			'Route (c, \'/test\')': ->
				c = {}
				url = '/test'
				route = Route c, url

				assert route instanceof Route
				assert.equal route.url, url
				assert.equal route.controller, c
				assert not route.pattern

			'new Route (c, /test/)': ->
				c = {}
				pattern = /\/test/
				route = new Route c, pattern

				assert route instanceof Route
				assert.equal route.pattern, pattern
				assert.equal route.controller, c
				assert not route.url

			'new Route (c, {})': ->
				c = {}
				url = '/test'
				options = { url: url }
				route = new Route c, options

				assert route instanceof Route
				assert.equal route.url, url
				assert.equal route.controller, c
				assert not route.pattern

			'new Route (c)': ->
				c = {}
				route = new Route c

				assert route instanceof Route
				assert.equal route.controller, c
				assert not route.url
				assert not route.pattern

			'new Route (c, #null)': ->
				ok = false

				try
					route = new Route {}, null
				catch error
					assert error instanceof Error
					ok = true
				finally
					assert ok

			'new Route (c, #function)': ->
				ok = false

				try
					route = new Route {}, ->
				catch error
					assert error instanceof Error
					ok = true
				finally
					assert ok

			'Route.from(#url)': ->
				route = new Route {}
				url = '/test/'

				assert.equal route.from(url), route
				assert.equal route.url, url
				assert not route.pattern

			'Route.from(#pattern)': ->
				route = new Route {}
				pattern = /test/

				assert.equal route.from(pattern), route
				assert.equal route.pattern, pattern
				assert not route.url

			'Route.from(#object)': ->
				ok = false
				route = new Route {}

				try
					route.from {}
				catch error
					assert error instanceof Error
					ok = true
				finally
					assert ok

			'Route.from(#null)': ->
				ok = false
				route = new Route {}

				try
					route.from null
				catch error
					assert error instanceof Error
					ok = true
				finally
					assert ok

			'Route.from(#undefined)': ->
				ok = true
				route = new Route {},
					url: 'test'

				try
					route.from()
				catch  error
					ok = false
				finally
					assert ok

				assert not route.url
				assert not route.pattern

			'Route.to(#undefined)': ->
				ok = false
				route = new Route {}, '/test'

				try
					route.to undefined
				catch error
					assert error instanceof Error
					ok = true
				finally
					assert ok

			'Route.to(#null)': ->
				ok = false
				route = new Route {}, /test/

				try
					route.to null
				catch error
					assert error instanceof Error
					ok = true
				finally
					assert ok

			'Route.to(#function)': ->
				ok = false
				callback = ->
				route = new Route
					_route: (how, where) ->
						ok = true
						assert.equal where, callback
						assert.equal how, route

				assert.equal route.from('test').to(callback), route
				assert ok

			'Route.from(#undefined).to(#function)': ->
				ok = false
				route = new Route {}

				try
					route.to ->
				catch error
					assert error instanceof Error
					ok = true
				finally
					assert ok

			'Route.set(#null)': ->
				ok = false
				route = new Route {}

				try
					route.set null
				catch error
					assert error instanceof Error
					ok = true
				finally
					assert ok

			'Route.set(#function)': ->
				ok = false
				route = new Route {}

				try
					route.set ->
				catch error
					assert error instanceof Error
					ok = true
				finally
					assert ok

			'Route.set(#string, value)': ->
				ok = false
				route = new Route {}, /test/

				# Plain property
				assert.equal route.set('url', 'test'), route
				assert.equal route.url, 'test'
				assert not route.pattern

				# Objectified property
				assert.equal route.set('methods', 'GET'), route
				assert.equal typeof route.methods, 'object'
				assert.equal Object.keys(route.methods).length, 1
				assert route.methods['GET']

				# Array
				assert.equal route.set('methods', ['HEAD', 'POST']), route
				assert.equal typeof route.methods, 'object'
				assert.equal Object.keys(route.methods).length, 2
				assert route.methods['POST']
				assert route.methods['HEAD']

				# Objectified property undefined
				assert.equal route.set('methods', undefined), route
				assert not route.methods

				# Plain property undefined
				assert.equal route.set('url', undefined), route
				assert not route.url

			'Route.set(#string, #null)': ->
				ok = false
				route = new Route {}

				try
					route.set 'url', null
				catch error
					assert error instanceof Error
					ok = true
				finally
					assert ok

				route = new Route {}
				ok = false

				try
					route.set 'pattern', null
				catch error
					assert error instanceof Error
					ok = true
				finally
					assert ok

			'Route.set(#object)': ->
				ok = false
				route = new Route {}

				# Url
				assert.equal route.set({ url: 'test' }), route
				assert.equal route.url, 'test'
				assert not route.pattern

				# Pattern
				assert.equal route.set({ pattern: /test/ }), route
				assert route.pattern.test 'test'
				assert not route.url

				# Plain property
				assert.equal route.set({ async: true }), route
				assert route.async

				# Objectified property
				assert.equal route.set({ methods: 'GET' }), route
				assert.equal typeof route.methods, 'object'
				assert.equal Object.keys(route.methods).length, 1
				assert route.methods['GET']

				# Array
				assert.equal route.set({ methods: ['HEAD', 'POST'] }), route
				assert.equal typeof route.methods, 'object'
				assert.equal Object.keys(route.methods).length, 2
				assert route.methods['POST']
				assert route.methods['HEAD']

				# Object
				assert.equal route.set({ methods: {'PUT': true, 'DELETE': true } }), route
				assert.equal typeof route.methods, 'object'
				assert.equal Object.keys(route.methods).length, 2
				assert route.methods['PUT']
				assert route.methods['DELETE']

				# Wrong type for objectified
				try
					route.set
						methods: ->
				catch error
					assert error instanceof Error
					ok = true
				finally
					assert ok

				ok = false

				try
					route.set
						methods: null
				catch error
					assert error instanceof Error
					ok = true
				finally
					assert ok

				# Objectified property undefined
				assert.equal route.set({ methods: undefined }), route
				assert not route.methods

				# Plain property undefined
				assert.equal route.set({ url: undefined }), route
				assert not route.url
				assert not route.pattern

			'Route.unset(#string)': ->
				ok = false
				route = new Route {}, 'test'

				assert.equal route.unset('url'), route
				assert not route.url
				assert not route.pattern

				route = new Route {}, /test/
				assert.equal route.unset('pattern'), route
				assert not route.url
				assert not route.pattern

				route.set 'async', true
				assert.equal route.unset('async'), route
				assert not route.async

			'Route.unset(#array)': ->
				ok = false
				route = new Route {}, 'test'

				route.set 'url', 'test'
				route.set { methods: ['GET', 'POST'], async: true }
				assert.equal route.unset(['url', 'methods', 'pattern', 'async']), route
				assert not route.url
				assert not route.methods
				assert not route.pattern
				assert not route.async

			'Route.unset(#null)': ->
				ok = false
				route = new Route {}

				try
					route.unset null
				catch error
					assert error instanceof Error
					ok = true
				finally
					assert ok

			'Route.unset(#undefined)': ->
				ok = false
				route = new Route {}

				try
					route.unset()
				catch error
					assert error instanceof Error
					ok = true
				finally
					assert ok

			'Route.unset(#object)': ->
				ok = false
				route = new Route {}

				try
					route.unset { 1: 'methods' }
				catch error
					assert error instanceof Error
					ok = true
				finally
					assert ok

			'Route.match(#null)': ->
				ok = false
				route = new Route {}

				try
					route.match null
				catch error
					assert error instanceof Error
					ok = true
				finally
					assert ok

			'Route.match(#empty)': ->
				route = new Route {}

				# Empty route always matches
				assert route.match {}
				assert route.match { method: 'HEAD' }
				assert route.match { host: 'localhost' }

			'Route.match(#methods)': ->
				route = new Route({}).set
					methods: ['GET', 'POST']

				assert route.match { method: 'GET' }
				assert route.match { method: 'POST' }
				assert not route.match {}
				assert not route.match { method: 'HEAD' }
				assert not route.match { host: 'localhost' }

			'Route.match(#hosts)': ->
				route = new Route({}).set
					hosts: ['microsoft.com', 'apple.com', 'kernel.org']

				assert route.match { host: 'microsoft.com' }
				assert route.match { host: 'apple.com' }
				assert route.match { host: 'kernel.org' }
				assert not route.match {}
				assert not route.match { method: 'HEAD' }
				assert not route.match { host: 'localhost' }

			'Route.match(#pattern)': ->
				route = new Route({}).set
					pattern: /\/test\/(123|456)\/ok/
					capture:
						'$1' : 'number'

				context =
					url: '/test/123/ok'

				assert route.match { url: '/test/123/ok' }
				assert route.match { url: '/test/456/ok' }
				assert route.match { url: '/test/456/ok', method: 'GET' }
				assert not route.match {}
				assert not route.match { hostname: 'localhost' }
				assert not route.match { url: '/test/13/ok' }
				assert not route.match { url: 'test/456/ok' }

				assert route.match(context)
				assert.equal typeof context.params, 'object'
				assert.equal context.params.number, '123'
				assert.equal context.params.$1, '123'
				assert not context.params.$2

				context =
					url: '/test/456/ok'

				assert.equal route.set('capture', { '$1' : 'test' }), route
				assert route.match(context)
				assert.equal context.params.test, '456'
				assert.equal context.params.$1, '456'
				assert not context.params.number
				assert not context.params.$2

			'Route.match(#types)': ->
				route = new Route({}).set
					types: ['text/html', 'text/text']

				assert route.match { types: ['text/html'] }
				assert route.match { types: ['text/text'] }
				assert route.match { types: ['html/html', 'text/text'] }
				assert route.match { types: ['text/text', 'html/html'] }
				assert route.match { types: ['text/text', 'text/html'] }
				assert route.match { types: ['text/*'] }
				assert route.match { types: ['text/plain', '*/*'] }

				assert not route.match { types: [] }
				assert not route.match { types: ['application/json'] }
				assert not route.match { types: ['application/json', 'html/html'] }

			'Route.copy(#full)': ->
				route = new Route({}).set
					url: 'test'
					methods: ['GET', 'POST']
					hosts: ['apple.com', 'microsoft.com']
					async: true
				copy = route.copy()

				assert copy instanceof Route
				assert.notEqual copy, route
				assert not copy.types
				assert not copy.capture
				assert not copy.pattern

				for field in ['url', 'pattern', 'async', 'capture', 'types']
					assert.equal copy[field], route[field]

				assert.deepEqual copy.methods, route.methods
				assert.deepEqual copy.hosts, route.hosts

			'Route.copy(#empty)': ->
				route = new Route {}
				copy = route.copy()

				assert copy instanceof Route
				assert.notEqual copy, route

				for field in ['methods', 'hosts', 'types', 'async', 'url', 'pattern', 'capture']
					assert.equal copy[field], route[field]
					assert not copy[field]
					assert not route[field]
	.export module
