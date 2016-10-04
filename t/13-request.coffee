assert   = require 'assert'
QS       = require 'querystring'
fetch    = require './lib/fetch'
Crixalis = require '../lib'

port  = +process.env.CRIXALIS_PORT + 13
parse = JSON.parse

Crixalis.view = 'json'
Crixalis
	.plugin('request')
	.route '/', ->
		@params.data    = parse @params.data    if @params.data and @params.type isnt 'custom'
		@params.headers = parse @params.headers if @params.headers

		@request @params, (error, result) =>
			@stash.json =
				code: result.statusCode
				body: result.message.toString()
			@render()

		return

	.route '/mirror', ->
		@stash.json =
			method: @method
			params: @params
			message: @message
			headers: @req.headers

		@render()
		return

	.start 'http', port
	.unref()

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
				path: '/?' + QS.stringify
					path: '/mirror?magic=1'
					method: 'GET'
					port: port

			status: (error, response) ->
				assert not error
				assert.equal response.statusCode, 200

			result: (error, response) ->
				result = parse response.body
				data   = parse result.body

				assert.equal       result.code, 200
				assert.equal       data.method, 'GET'
				assert.deepEqual   data.params, magic: 1
				assert.isUndefined data.headers['content-length']

		'http post#form':
			topic: request
				path: '/?' + QS.stringify
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
				path: '/?' + QS.stringify
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
				path: '/?' + QS.stringify
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
