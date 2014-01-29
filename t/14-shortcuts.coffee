assert = require 'assert'
fetch  = require './lib/fetch.js'
c      = require '../lib/controller.js'

port = process.env.CRIXALIS_PORT + 14
c.plugin 'shortcuts', ['put', 'get', 'post', 'any']

dumper = ->
	@view = 'json'
	@stash.json =
		code: @code or 200
		method: @method
		url: @url

c.on 'default', ->
	@code = 404
	dumper.call @

c.start 'http', port

checker = (expected) ->
	return (error, response) ->
		data = JSON.parse(response.body)
		assert.deepEqual data, expected

request = (options) ->
	options.before() if typeof options.before is 'function'

	options.host   ?= 'localhost'
	options.port   ?= port
	options.path   ?= '/'
	options.method ?= 'GET'

	return ->
		fetch options, @callback
		return

(require 'vows')
	.describe('shortcuts')
	.addBatch
		'via#get':
			topic: request
				path: '/via/A'
				before: ->
					c.router()
						.from('/via/A')
						.via('GET')
						.to(dumper)

			result: checker
				code: 200
				method: 'GET'
				url: '/via/A'

		'via#post':
			topic: request
				path: '/via/A'
				method: 'POST'
				before: ->
					c.router()
						.from('/via/A')
						.via('POST')
						.to(dumper)

			result: checker
				code: 200
				method: 'POST'
				url: '/via/A'

		'via#put':
			topic: request
				path: '/via/A'
				method: 'PUT'
				before: ->
					1

			result: checker
				code: 404
				method: 'PUT'
				url: '/via/A'

		'via#get+post':
			topic: request
				path: '/via/B'
				method: 'GET'
				before: ->
					c.router()
						.from('/via/B')
						.via(['GET', 'POST'])
						.to(dumper)

			result: checker
				code: 200
				method: 'GET'
				url: '/via/B'

		'via#error':
			topic: 'error'
			result: (topic) ->
				assert.throws ->
					c.router()
						.from('/via/null')
						.via()

				assert.throws ->
					c.router()
						.from('/via/null')
						.via([], undefined)

		'methods':
			topic: c.router()

			get: (route) ->
				assert.isFunction route.get

			post: (route) ->
				assert.isFunction route.post

			put: (route) ->
				assert.isFunction route.put

			any: (route) ->
				assert.isFunction route.any

			undefined: (route) ->
				assert.isUndefined route.head
				assert.isUndefined route.options
				assert.isUndefined route.patch
				assert.isUndefined route.delete

		'methods#get':
			topic: 'get'

			simple:
				topic: request
					path: '/methods/C'
					method: 'GET'
					before: ->
						c.router()
							.from('/methods/C')
							.get()
							.to(dumper)

				result: checker
					code: 200
					method: 'GET'
					url: '/methods/C'

			path:
				topic: request
					path: '/methods/D'
					method: 'GET'
					before: ->
						c.router()
							.get('/methods/D')
							.to(dumper)

				result: checker
					code: 200
					method: 'GET'
					url: '/methods/D'

			full:
				topic: request
					path: '/methods/E'
					method: 'GET'
					before: ->
						c.router()
							.get('/methods/E', dumper)

				result: checker
					code: 200
					method: 'GET'
					url: '/methods/E'

		'methods#any':
			topic: 'any'

			simple:
				topic: request
					path: '/methods/F'
					method: 'GET'
					before: ->
						c.router()
							.any('/methods/F', dumper)
							.to(dumper)

				result: checker
					code: 200
					method: 'GET'
					url: '/methods/F'

			override:
				topic: request
					path: '/methods/G'
					method: 'PUT'
					before: ->
						c.router()
							.from('/methods/G')
							.via('GET', 'HEAD')
							.any()
							.to(dumper)

				result: checker
					code: 200
					method: 'PUT'
					url: '/methods/G'

	.export module
