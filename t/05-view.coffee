assert   = require 'assert'
fetch    = require './lib/fetch'
copy     = require './lib/copy'
status   = require('http').STATUS_CODES
port     = +process.env.CRIXALIS_PORT + 5
Crixalis = require '../lib'

html = '<html><body><h1>Test</h1></body></html>'
json =
	result:
		status: 'ok'

Crixalis
	.route '/redirect/:url', ->
		@redirect('/' + @params.url)
	.route '/json', ->
		@stash.json = json

		@render()
	.route '/html', ->
		@body = html

		@render()
	.route '/null', ->
		@render()
	.route '/error', ->
		@error(503)
	.start 'http', port
	.unref()

request = (options) ->
	options.host   ?= 'localhost'
	options.port   ?= port
	options.path   ?= '/'
	options.method ?= 'GET'

	return ->
		fetch options, @callback
		return

matches = (expected) ->
	return (error, response) ->
		if expected.path
			assert.equal expected.path, response.headers['location']

		if expected.type
			assert.equal expected.type, response.headers['content-type']

		if expected.size
			assert.equal expected.size, response.headers['content-length']

		if expected.data
			assert.deepEqual expected.data, response.body

		if expected.code
			assert.equal expected.code, response.statusCode

		return

(require 'vows')
	.describe('view')
	.addBatch
		redirect:
			topic: request
				path: '/redirect/json'

			result: matches
				code: 302
				type: undefined
				path: '/json'
				data: status[302]
				size: Buffer.byteLength status[302]

		json:
			topic: null

			get:
				topic: request
					method: 'GET'
					path: '/json'

				result: matches
					code: 200
					type: 'application/json; charset=utf-8'
					size: Buffer.byteLength JSON.stringify json
					data: JSON.stringify json

			head:
				topic: request
					method: 'HEAD'
					path: '/json'

				result: matches
					code: 200
					type: 'application/json; charset=utf-8'
					size: Buffer.byteLength JSON.stringify json

		html:
			topic: null

			get:
				topic: request
					method: 'GET'
					path: '/html'

				result: matches
					code: 200
					type: 'text/html; charset=utf-8'
					size: Buffer.byteLength html
					data: html

			head:
				topic: request
					method: 'HEAD'
					path: '/html'

				result: matches
					code: 200
					type: 'text/html; charset=utf-8'
					size: Buffer.byteLength html

		none:
			topic: null

			get:
				topic: request
					method: 'GET'
					path: '/null'

				result: matches
					code: 204
					type: undefined
					size: undefined
					data: undefined

			head:
				topic: request
					method: 'HEAD'
					path: '/null'

				result: matches
					code: 204
					type: undefined
					size: undefined
					data: undefined

			post:
				topic: request
					method: 'POST'
					path: '/null'

				result: matches
					code: 200 # should not set 204 for POST request
					type: undefined
					size: undefined
					data: undefined

		error:
			topic: null

			json:
				topic: request
					method: 'POST'
					path: '/error'
					headers:
						accept: 'application/json'

				result: matches
					code: 503
					type: 'application/json; charset=utf-8'
					data: JSON.stringify
						error:
							message: status[503]

			html:
				topic: request
					method: 'POST'
					path: '/error'
					headers:
						accept: 'text/html'

				result: matches
					code: 503
					type: 'text/html; charset=utf-8'
					size: Buffer.byteLength status[503]
					data: status[503]

			400:
				topic: request
					method: 'POST'
					path: '/redirect/json'
					headers:
						'content-type': 'application/json'
						'accept': 'application/json'
					data: '{["json...'

				result: matches
					code: 400
					type: 'application/json; charset=utf-8'
					data: JSON.stringify
						error:
							message: status[400]

			404:
				topic: request
					method: 'POST'
					path: '/notfound'

				result: matches
					code: 404
					type: 'text/html; charset=utf-8'
					size: Buffer.byteLength status[404]
					data: status[404]

			default:
				topic: request
					method: 'POST'
					path: '/error'

				result: matches
					code: 503
					type: 'text/html; charset=utf-8'
					size: Buffer.byteLength status[503]
					data: status[503]
	.export(module)
