Crixalis = require '../lib/controller.js'
assert   = require 'assert'
port     = +process.env.CRIXALIS_PORT + 18
zlib     = require 'zlib'

Data = status: 'ok'

Crixalis
	.plugin('compression')
	.plugin('request')
	.plugin('shortcuts')
	.get '/', ->
		@stash.json = Data

		@render()
		return
	.start('http', port)
	.unref()

Crixalis.staticPath = 't'
Crixalis.view = 'json'

(require 'vows')
	.describe('compression')
	.addBatch
		basic:
			topic: ->
				params =
					host: 'localhost'
					port: port
					path: '/'
					encoding: 'binary'

				Crixalis.request(params, @callback)
				return

			error:  (error, result) -> assert.equal error, null
			result: (error, result) -> assert.equal result.statusCode, 200

			body: (error, result) ->
				assert.equal result.message.length, Buffer.byteLength(JSON.stringify(Data))
				assert.equal result.message.toString(), JSON.stringify(Data)

			headers: (error, result) ->
				assert.equal result.headers['content-length'], Buffer.byteLength(JSON.stringify(Data))
				assert.equal result.headers['content-type'], 'application/json; charset=utf-8'
				assert !('vary' of result.headers)

		gzip:
			topic: ->
				params =
					host: 'localhost'
					port: port
					path: '/'
					headers:
						'accept-encoding': 'gzip'

				Crixalis.request(params, @callback)
				return

			error:  (error, result) -> assert.equal error, null
			result: (error, result) -> assert.equal result.statusCode, 200

			body:
				topic: (result) ->
					zlib.gunzip result.message, @callback
					return

				decompress: (error, result) ->
					assert.equal result, JSON.stringify(Data)

			headers: (error, result) ->
				assert.equal result.headers['content-length'], result.message.length
				assert.equal result.headers['content-type'], 'application/json; charset=utf-8'
				assert.equal result.headers['content-encoding'], 'gzip'
				assert.equal result.headers.vary, 'Accept-Encoding'

		deflate:
			topic: ->
				params =
					host: 'localhost'
					port: port
					path: '/'
					headers:
						'accept-encoding': 'deflate'

				Crixalis.request(params, @callback)
				return

			error:  (error, result) -> assert.equal error, null
			result: (error, result) -> assert.equal result.statusCode, 200

			body:
				topic: (result) ->
					zlib.inflate result.message, @callback
					return

				decompress: (error, result) ->
					assert.equal result, JSON.stringify(Data)

			headers: (error, result) ->
				assert.equal result.headers['content-length'], result.message.length
				assert.equal result.headers['content-type'], 'application/json; charset=utf-8'
				assert.equal result.headers['content-encoding'], 'deflate'
				assert.equal result.headers.vary, 'Accept-Encoding'

		any:
			topic: ->
				params =
					host: 'localhost'
					port: port
					path: '/'
					headers:
						'accept-encoding': '*'

				Crixalis.request(params, @callback)
				return

			error:  (error, result) -> assert.equal error, null
			result: (error, result) -> assert.equal result.statusCode, 200

			body:
				topic: (result) ->
					zlib[if Crixalis.defaultCompression is 'gzip' then 'gunzip' else 'inflate'] result.message, @callback
					return

				decompress: (error, result) ->
					assert.equal result, JSON.stringify(Data)

			headers: (error, result) ->
				assert.equal result.headers['content-length'], result.message.length
				assert.equal result.headers['content-type'], 'application/json; charset=utf-8'
				assert.equal result.headers['content-encoding'], Crixalis.defaultCompression
				assert.equal result.headers.vary, 'Accept-Encoding'

	.export(module)
