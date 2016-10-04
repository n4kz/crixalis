assert   = require 'assert'
port     = +process.env.CRIXALIS_PORT + 19
zlib     = require 'zlib'
fs       = require 'fs'
Crixalis = require '../lib'

Crixalis
	.plugin('compression')
	.plugin('static', route: yes)
	.plugin('request')
	.start('http', port)
	.unref()

Crixalis.staticPath = 't'
Crixalis.cachePath  = 't/tmp_' + port

try
	fs.mkdirSync('t/tmp_' + port)
catch error
	console.warn error

(require 'vows')
	.describe('static-compression')
	.addBatch
		gzip:
			topic: ->
				params =
					host: 'localhost'
					port: port
					path:  __filename.replace(/^.*(?=\/)/, '')
					headers: 'accept-encoding': 'gzip'

				Crixalis.request(params, @callback)
				return

			error:  (error, result) -> assert.equal error, null
			result: (error, result) -> assert.equal result.statusCode, 200

			body:
				topic: (result) ->
					zlib.gunzip result.message, @callback
					return

				decompress: (error, result) ->
					assert.equal result.toString(), fs.readFileSync(__filename)

			headers: (error, result) ->
				stat = fs.statSync(__filename)

				assert.notEqual result.headers['content-length'], stat.size
				assert.equal result.headers['content-length'], result.message.length
				assert.equal result.headers['last-modified'], stat.mtime.toUTCString()
				assert.equal result.headers['content-type'], 'application/javascript; charset=utf-8'
				assert.equal result.headers['content-encoding'], 'gzip'
				assert.equal result.headers.vary, 'Accept-Encoding'
				assert.match result.headers.etag, /^"[a-z0-9\/+]+-g"$/i

		deflate:
			topic: ->
				params =
					host: 'localhost'
					port: port
					path:  __filename.replace(/^.*(?=\/)/, '')
					headers: 'accept-encoding': 'deflate'

				Crixalis.request(params, @callback)
				return

			error:  (error, result) -> assert.equal error, null
			result: (error, result) -> assert.equal result.statusCode, 200

			body:
				topic: (result) ->
					zlib.inflate result.message, @callback
					return

				decompress: (error, result) ->
					assert.equal result.toString(), fs.readFileSync(__filename)

			headers: (error, result) ->
				stat = fs.statSync(__filename)

				assert.notEqual result.headers['content-length'], stat.size

				assert.equal result.headers['content-length'], result.message.length
				assert.equal result.headers['last-modified'], stat.mtime.toUTCString()
				assert.equal result.headers['content-type'], 'application/javascript; charset=utf-8'
				assert.equal result.headers['content-encoding'], 'deflate'
				assert.equal result.headers.vary, 'Accept-Encoding'
				assert.match result.headers.etag, /^"[a-z0-9\/+]+-d"$/i

		ifmodsince304:
			topic: ->
				params =
					host: 'localhost'
					port: port
					path:  __filename.replace(/^.*(?=\/)/, '')
					headers:
						'accept-encoding': '*'
						'if-modified-since': fs.statSync(__filename).mtime.toUTCString()

				Crixalis.request(params, @callback)
				return

			error:  (error, result) -> assert.equal error, null
			result: (error, result) -> assert.equal result.statusCode, 304
			body:    (error, result) -> assert.equal result.message.toString(), ''

			headers: (error, result) ->
				assert.isUndefined result.headers['vary']
				assert.isUndefined result.headers['content-type']
				assert.isUndefined result.headers['content-length']
				assert.isUndefined result.headers['last-modified']
				assert.isUndefined result.headers['etag']

		ifnonematch304:
			topic: ->
				params =
					host: 'localhost'
					port: port
					path:  __filename.replace(/^.*(?=\/)/, '')
					headers:
						'accept-encoding': 'deflate'

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
