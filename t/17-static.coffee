Crixalis = require '../lib/controller.js'
assert   = require 'assert'
fs       = require 'fs'
port     = +process.env.CRIXALIS_PORT + 17

Crixalis
	.plugin('static')
	.plugin('request')
	.start('http', port)
	.unref()

Crixalis
	.staticPath = 't'

(require 'vows')
	.describe('static')
	.addBatch
		basic:
			topic: ->
				params =
					host: 'localhost'
					port: port
					path:  __filename.replace(/^.*(?=\/)/, '')

				Crixalis.request(params, @callback)
				return

			error:  (error, result) -> assert.equal error, null
			result: (error, result) -> assert.equal result.statusCode, 200

			body: (error, result) ->
				assert.equal result.message.length, fs.statSync(__filename).size
				assert.equal result.message.toString(), fs.readFileSync(__filename)

			headers: (error, result) ->
				stat = fs.statSync(__filename)

				assert.equal result.headers['last-modified'], stat.mtime.toUTCString()
				assert.equal result.headers['content-length'], stat.size
				assert.equal result.headers['content-type'], 'application/javascript; charset=utf-8'
				assert.equal result.headers.vary, 'Accept-Encoding'

		'modified#200':
			topic: ->
				params =
					host: 'localhost'
					port: port
					path:  __filename.replace(/^.*(?=\/)/, '')
					headers:
						'if-modified-since': new Date(0).toUTCString()

				Crixalis.request(params, @callback)
				return

			error:  (error, result) -> assert.equal error, null
			result: (error, result) -> assert.equal result.statusCode, 200

			body: (error, result) ->
				assert.equal result.message.length, fs.statSync(__filename).size
				assert.equal result.message.toString(), fs.readFileSync(__filename)

			headers: (error, result) ->
				stat = fs.statSync(__filename)

				assert.equal result.headers['last-modified'], stat.mtime.toUTCString()
				assert.equal result.headers['content-length'], stat.size
				assert.equal result.headers['content-type'], 'application/javascript; charset=utf-8'
				assert.equal result.headers.vary, 'Accept-Encoding'

		'modified#304':
			topic: ->
				params =
					host: 'localhost'
					port: port
					path:  __filename.replace(/^.*(?=\/)/, '')
					headers:
						'if-modified-since': fs.statSync(__filename).mtime.toUTCString()

				Crixalis.request(params, @callback)
				return

			error:   (error, result) -> assert.equal error, null
			result:  (error, result) -> assert.equal result.statusCode, 304
			body:    (error, result) -> assert.equal result.message.toString(), ''
			headers: (error, result) ->
				stat = fs.statSync(__filename)

				assert.equal result.headers['last-modified'], stat.mtime.toUTCString()
				assert !('vary' of result.headers)
				assert !('content-type' of result.headers)
				assert !('content-length' of result.headers)

	.export(module)
