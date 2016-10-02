Crixalis = require '../lib/controller.js'
fetch    = require './lib/fetch.js'
assert   = require 'assert'
port     = +process.env.CRIXALIS_PORT + 3
QS       = require 'querystring'

ck1  = '5e91faa3a8a30ee154f'
ck2  = '1477746269'

stamp = Date.now()

params =
	path: '/info?silent&color=blue'
	host: '127.0.0.1'
	port: port
	headers:
		'Cookie': "ck1=#{ck1};ck2=#{ck2}"
		'Accept-Encoding': 'gzip,deflate;q=0.6,br'
		'Accept': 'text/html,*/*;q=0.8,application/xhtml+xml,application/xml;q=0.9'

data =
	version: '2.1'
	color: 'red'

Crixalis
	.start('http', port)
	.unref()

(require 'vows')
	.describe('context')
	.addBatch
		get:
			topic: ->
				callback = @callback

				Crixalis.route '/info', methods: ['GET'], ->
					callback(null, @)

					@code = 204
					@render(null)

					return

				fetch params, ->

				return

			start: (context) ->
				assert context.start >= stamp
				assert context.start <= Date.now()

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
				assert.deepEqual context.params, color: 'blue'

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
				callback = @callback

				Crixalis.route '/json', { methods: ['POST'], types: ['application/json'] } , ->
					callback(null, @)

					@code = 204
					@render(null)

					return

				params.path = '/json?silent&color=blue'
				params.headers['Content-Type'] = 'application/json; charset=utf-8; color=green'
				params.method = 'POST'
				params.data   = JSON.stringify data

				fetch params, ->

				return

			start: (context) ->
				assert context.start >= stamp
				assert context.start <= Date.now()

			url: (context) ->
				assert.equal context.url, '/json'

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
				assert.deepEqual context.params, color: 'blue'

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
				assert.equal context.message.length, JSON.stringify(data).length
				assert.equal context.message.charset, 'utf-8'
				assert.equal context.message.color, 'green'

				assert.deepEqual context.message.data, data

		form:
			topic: ->
				callback = @callback

				Crixalis.route '/form', { methods: ['POST'], types: 'application/*' }, ->
					callback(null, @)

					@code = 204
					@render(null)

					return

				params.path = '/form?silent&color=blue'
				params.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8; color=green'
				params.method = 'POST'
				params.data   = QS.stringify data

				fetch params, ->

				return

			start: (context) ->
				assert context.start >= stamp
				assert context.start <= Date.now()

			url: (context) ->
				assert.equal context.url, '/form'

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
				assert.deepEqual context.params, data

			keywords: (context) ->
				assert.deepEqual context.keywords, silent: yes

			stash: (context) ->
				assert.deepEqual context.stash, {}

			cookies: (context) ->
				assert.deepEqual context.cookies,
					ck1: ck1,
					ck2: ck2

			message: (context) ->
				assert.equal context.message.type, 'application/x-www-form-urlencoded'
				assert.equal context.message.length, QS.stringify(data).length
				assert.equal context.message.charset, 'utf-8'
				assert.equal context.message.color, 'green'

				assert.isUndefined context.message.data

	.export(module)
