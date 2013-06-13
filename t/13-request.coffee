assert = require 'assert'
fetch  = require './lib/fetch.js'
c      = require '../lib/controller.js'
qs     = require('querystring').stringify

port = process.env.CRIXALIS_PORT
parse = JSON.parse

c.view = 'json'
c.plugin('request')
c.router('/').to ->
	@async = yes

	@params.data = parse @params.data if @params.data

	@request @params, (error, result) =>
		@stash.json =
			code: result.statusCode
			body: result.body
		@render()

	return

c.router('/mirror').to ->
	@stash.json =
		method: @method
		params: @params
		message: @message

	return

c.start 'http', port

request = (options) ->
	options.host ?= 'localhost'
	options.port ?= port
	options.path ?= '/'

	return ->
		fetch options, @callback
		return

(require 'vows')
	.describe('request')
	.addBatch
		'http get':
			topic: request
				path: '/?' + qs
					path: '/mirror?magic=1'
					method: 'GET'
					port: port

			status: (error, response) ->
				assert not error
				assert.equal response.statusCode, 200

			result: (error, response) ->
				result      = parse response.body
				result.body = parse result.body

				assert.equal     result.code,        200
				assert.equal     result.body.method, 'GET'
				assert.deepEqual result.body.params, magic: 1

		'http post#form':
			topic: request
				path: '/?' + qs
					path: '/mirror?magic=1'
					method: 'POST'
					port: port
					type: 'form'
					data: JSON.stringify(magic: 2)

			status: (error, response) ->
				assert not error
				assert.equal response.statusCode, 200

			result: (error, response) ->
				result      = parse response.body
				result.body = parse result.body

				assert.equal     result.code,                200
				assert.equal     result.body.method,         'POST'
				assert.deepEqual result.body.params,         magic: 2
				assert.equal     result.body.message.type,   'application/x-www-form-urlencoded'
				assert.equal     result.body.message.length, 7 # magic=2

		'http post#json':
			topic: request
				path: '/?' + qs
					path: '/mirror?magic=1'
					method: 'POST'
					port: port
					type: 'json'
					data: JSON.stringify(magic: 2)

			status: (error, response) ->
				assert not error
				assert.equal response.statusCode, 200

			result: (error, response) ->
				result      = parse response.body
				result.body = parse result.body

				assert.equal     result.code,                200
				assert.equal     result.body.method,         'POST'
				assert.deepEqual result.body.params,         magic: 1
				assert.deepEqual result.body.message.data,   magic: 2
				assert.equal     result.body.message.type,   'application/json'
				assert.equal     result.body.message.length, 11 # {"magic":2}

	.export module
