assert   = require 'assert'
fetch    = require './lib/fetch.js'
copy     = require './lib/copy.js'
Crixalis = require '../lib/controller.js'
today    = (new Date()).toUTCString().slice(0, 16)
port     = +process.env.CRIXALIS_PORT + 11

status = require('http').STATUS_CODES

Crixalis
	.route '/', methods: ['GET'], ->
		@view  = @params.view
		@stash = JSON.parse(@params.stash or '{}')
		@body  = @params.body

		@render()
		return

	.start 'http', port
	.unref()

topic = (options) ->
	options.tests.topic = (topic) ->
		params = copy topic
		params.path += '?body=' + options.body
		params.path += ';view=' + options.view

		if options.stash
			params.path += ';stash=' + options.stash

		if options.callback
			params.path += ';callback=' + options.callback

		fetch params, @callback

		return

	return options.tests

(require 'vows')
	.describe('view')
	.addBatch
		response:
			topic:
				host: '127.0.0.1'
				port: port
				path: '/'

			null: topic
				view: 'null'
				body: 'nulltest'
				tests:
					status: (error, response) ->
						assert.isNull error
						assert.equal  response.statusCode, 200

					headers: (error, response) ->
						assert.equal   response.headers['content-type'],   undefined
						assert.equal   response.headers['content-length'], 8
						assert.include response.headers['date'],           today

					body: (error, response) ->
						assert.equal response.body, 'nulltest'

			html: topic
				view: 'html'
				body: 'htmltest'
				tests:
					status: (error, response) ->
						assert.isNull error
						assert.equal  response.statusCode, 200

					headers: (error, response) ->
						assert.equal   response.headers['content-type'],   'text/html; charset=utf-8'
						assert.equal   response.headers['content-length'], 8
						assert.include response.headers['date'],           today

					body: (error, response) ->
						assert.equal response.body, 'htmltest'

			json: topic
				view: 'json'
				body: 'jsontest'
				stash: JSON.stringify
					json:
						test: 'json'
				tests:
					status: (error, response) ->
						assert.isNull error
						assert.equal  response.statusCode, 200

					headers: (error, response) ->
						assert.equal   response.headers['content-type'],   'application/json; charset=utf-8'
						assert.equal   response.headers['content-length'], 15
						assert.include response.headers['date'],           today

					body: (error, response) ->
						assert.equal response.body, '{"test":"json"}'

			jsonp: topic
				view: 'jsonp'
				body: 'jsonptest'
				callback: 'CB'
				stash: JSON.stringify
					json:
						test: 'json'
				tests:
					status: (error, response) ->
						assert.isNull error
						assert.equal  response.statusCode, 200

					headers: (error, response) ->
						assert.equal   response.headers['content-type'],   'application/javascript; charset=utf-8'
						assert.equal   response.headers['content-length'], 20
						assert.include response.headers['date'],           today

					body: (error, response) ->
						assert.equal response.body, 'CB({"test":"json"});'

			redirect: topic
				view: 'redirect'
				body: 'redirecttest'
				stash: JSON.stringify
					url: 'localhost'
				tests:
					status: (error, response) ->
						assert.isNull error
						assert.equal  response.statusCode, 302

					headers: (error, response) ->
						assert.equal   response.headers['content-type'],   'text/html; charset=utf-8'
						assert.equal   response.headers['content-length'], Buffer.byteLength(status[302])
						assert.equal   response.headers['location'],       'localhost'
						assert.include response.headers['date'],           today

					body: (error, response) ->
						assert.equal response.body, status[302]

	.export module
