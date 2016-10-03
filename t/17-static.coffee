Crixalis = require '../lib/controller.js'
assert   = require 'assert'
fs       = require 'fs'
port     = +process.env.CRIXALIS_PORT + 17

Crixalis
	.plugin('static', route: yes)
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
				assert.match result.headers.etag, /^"[a-z0-9\/+]+"$/i

		ifmodsince200:
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
				assert.match result.headers.etag, /^"[a-z0-9\/+]+"$/i

		ifmodsince304:
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
				assert.isUndefined result.headers['vary']
				assert.isUndefined result.headers['content-type']
				assert.isUndefined result.headers['content-length']
				assert.isUndefined result.headers['last-modified']
				assert.isUndefined result.headers['etag']

		ifnonematch200:
			topic: ->
				params =
					host: 'localhost'
					port: port
					path:  __filename.replace(/^.*(?=\/)/, '')
					headers:
						'if-none-match': '"4BNTmsHehOy7XICcRxsQYMcArjc", "FS3sEHdTbkvJzbQey/ZzZH93h08"'

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
				assert.match result.headers.etag, /^"[a-z0-9\/+]+"$/i

		ifnonematch304:
			topic: ->
				params =
					host: 'localhost'
					port: port
					path:  __filename.replace(/^.*(?=\/)/, '')
					headers: {}

				Crixalis.request params, (error, result) =>
					params.headers['if-none-match'] = result.headers.etag

					Crixalis.request(params, @callback)

				return

			error:   (error, result) -> assert.equal error, null
			result:  (error, result) -> assert.equal result.statusCode, 304
			body:    (error, result) -> assert.equal result.message.toString(), ''
			headers: (error, result) ->
				assert.isUndefined result.headers['vary']
				assert.isUndefined result.headers['content-type']
				assert.isUndefined result.headers['content-length']
				assert.isUndefined result.headers['last-modified']
				assert.isUndefined result.headers['etag']

	.export(module)
