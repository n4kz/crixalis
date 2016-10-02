Crixalis = require '../lib/controller.js'
fetch    = require './lib/fetch.js'
assert   = require 'assert'
port     = +process.env.CRIXALIS_PORT + 3

ck1  = '5e91faa3a8a30ee154f'
ck2  = '1477746269'

stamp = Date.now()

params =
	path: '/info?silent&port=8080'
	host: '127.0.0.1'
	port: port
	headers:
		'Cookie': "ck1=#{ck1};ck2=#{ck2}"
		'Accept-Encoding': 'gzip,deflate;q=0.6,br'
		'Accept': 'text/html,*/*;q=0.8,application/xhtml+xml,application/xml;q=0.9'
		'Content-Type': 'application/json; charset=utf-8; color=green'

jsonData =
	method: 'info.request'
	version: '2.1'
	payload: null

Crixalis
	.start('http', port)
	.unref()

(require 'vows')
	.describe('context')
	.addBatch
		get:
			topic: ->
				callback = @callback.bind(@)

				Crixalis.route '/info', methods: ['GET'], ->
					callback(null, @)

					@code = 204
					@render(null)

					return

				fetch params, ->

				return

			start: (context) ->
				assert context.start > stamp
				assert context.start < Date.now()

			url: (context) ->
				assert.equal context.url, '/info'

			method: (context) ->
				assert.equal context.method, 'GET'

				assert.isTrue context.is_get

				assert.isFalse context.is_head
				assert.isFalse context.is_post
				assert.isFalse context.is_put
				assert.isFalse context.is_delete

			host: (context) ->
				assert.equal context.host, params.host

			port: (context) ->
				assert.equal context.port, port

			params: (context) ->
				assert.deepEqual context.params, port: 8080

			keywords: (context) ->
				assert.deepEqual context.keywords, silent: yes

			stash: (context) ->
				assert.deepEqual context.stash, {}

			cookies: (context) ->
				assert.deepEqual context.cookies,
					ck1: ck1,
					ck2: ck2

			codings: (context) ->
				assert.deepEqual context.codings, [
					'gzip',
					'br',
					'deflate'
				]

			types: (context) ->
				assert.deepEqual context.types, [
					'text/html',
					'application/xhtml+xml',
					'application/xml',
					'*/*'
				]

		json:
			topic: ->
				callback = @callback.bind(@)

				Crixalis.route '/info', methods: ['POST'], ->
					callback(null, @)

					@code = 204
					@render(null)

					return

				params.method = 'POST'
				params.data   = JSON.stringify jsonData

				fetch params, ->

				return

			start: (context) ->
				assert context.start > stamp
				assert context.start < Date.now()

			url: (context) ->
				assert.equal context.url, '/info'

			method: (context) ->
				assert.equal context.method, 'POST'

				assert.isTrue context.is_post

				assert.isFalse context.is_head
				assert.isFalse context.is_get
				assert.isFalse context.is_put
				assert.isFalse context.is_delete

			host: (context) ->
				assert.equal context.host, params.host

			port: (context) ->
				assert.equal context.port, port

			params: (context) ->
				assert.deepEqual context.params, port: 8080

			keywords: (context) ->
				assert.deepEqual context.keywords, silent: yes

			stash: (context) ->
				assert.deepEqual context.stash, {}

			cookies: (context) ->
				assert.deepEqual context.cookies,
					ck1: ck1,
					ck2: ck2

			message: (context) ->
				assert.equal context.message.type, 'application/json'
				assert.equal context.message.length, JSON.stringify(jsonData).length
				assert.equal context.message.charset, 'utf-8'
				assert.equal context.message.color, 'green'

				assert.deepEqual context.message.data, jsonData

		# TODO POST with application/x-www-form-urlencoded

	.export(module)
