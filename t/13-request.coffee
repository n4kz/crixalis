assert = require 'assert'
fetch  = require './lib/fetch.js'
c      = require '../lib/controller.js'
qs     = require('querystring').stringify

port  = +process.env.CRIXALIS_PORT + 13
parse = JSON.parse

c.view = 'json'
c.plugin('request')
c.router('/').to ->
	@async = yes

	@params.data    = parse @params.data    if @params.data and @params.type isnt 'custom'
	@params.headers = parse @params.headers if @params.headers

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
		headers: @req.headers

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
				result = parse response.body
				data   = parse result.body

				assert.equal       result.code,        200
				assert.equal       data.method, 'GET'
				assert.deepEqual   data.params, magic: 1
				assert.isUndefined data.headers['content-length']

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
				result = parse response.body
				data   = parse result.body

				assert.equal     result.code,                    200
				assert.equal     data.method,                    'POST'
				assert.deepEqual data.params,                    magic: 2
				assert.equal     data.message.type,              'application/x-www-form-urlencoded'
				assert.equal     data.message.length,            7 # magic=2
				assert.equal     data.headers['content-length'], data.message.length
				assert.equal     data.headers['content-type'],   data.message.type

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
				result = parse response.body
				data   = parse result.body

				assert.equal     result.code,                    200
				assert.equal     data.method,                    'POST'
				assert.deepEqual data.params,                    magic: 1
				assert.deepEqual data.message.data,              magic: 2
				assert.equal     data.message.type,              'application/json'
				assert.equal     data.message.length,            11 # {"magic":2}
				assert.equal     data.headers['content-length'], data.message.length
				assert.equal     data.headers['content-type'],   data.message.type

		'http post#custom':
			topic: request
				path: '/?' + qs
					path: '/mirror?magic=1'
					method: 'POST'
					port: port
					type: 'custom'
					data: JSON.stringify(magic: 4)
					headers: JSON.stringify
						'content-type': 'application/octet-stream'
						'content-length': 11

			status: (error, response) ->
				assert not error
				assert.equal response.statusCode, 200

			result: (error, response) ->
				result = parse response.body
				data   = parse result.body

				assert.equal     result.code,                    200
				assert.equal     data.method,                    'POST'
				assert.deepEqual data.params,                    magic: 1
				assert.equal     data.message.data,              '{"magic":4}'
				assert.equal     data.message.type,              'application/octet-stream'
				assert.equal     data.message.length,            11 # {"magic":4}
				assert.equal     data.headers['content-length'], data.message.length
				assert.equal     data.headers['content-type'],   data.message.type

	.export module
