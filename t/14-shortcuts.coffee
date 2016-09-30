assert   = require 'assert'
fetch    = require './lib/fetch.js'
Crixalis = require '../lib/controller.js'

port = +process.env.CRIXALIS_PORT + 14

dumper = ->
	@view = 'json'
	@stash.json =
		code: @code or 200
		method: @method
		url: @url

	@render()
	return

Crixalis
	.plugin 'shortcuts', ['get', 'Post', 'PUT']
	.on 'default', ->
		@code = 404
		dumper.call @

	.start 'http', port
	.unref()

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
		'define':
			topic: null

			get: ->
				assert.isFunction Crixalis.get

			post: ->
				assert.isFunction Crixalis.post

			put: ->
				assert.isFunction Crixalis.put

			undefined: ->
				assert.isUndefined Crixalis.head
				assert.isUndefined Crixalis.options
				assert.isUndefined Crixalis.patch
				assert.isUndefined Crixalis.delete

		'verify':
			topic: 'get'

			get:
				topic: request
					path: '/methods/C'
					method: 'GET'
					before: ->
						Crixalis.get('/methods/C', dumper)

				result: checker
					code: 200
					method: 'GET'
					url: '/methods/C'

			post:
				topic: request
					path: '/methods/D'
					method: 'POST'
					before: ->
						Crixalis.post('/methods/D', dumper)

				result: checker
					code: 200
					method: 'POST'
					url: '/methods/D'

			put:
				topic: request
					path: '/methods/E'
					method: 'PUT'
					before: ->
						Crixalis.put('/methods/E', dumper)

				result: checker
					code: 200
					method: 'PUT'
					url: '/methods/E'

	.export module
