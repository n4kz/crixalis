assert   = require 'assert'
port     = +process.env.CRIXALIS_PORT + 20
zlib     = require 'zlib'
fs       = require 'fs'
Crixalis = require '../lib'

Crixalis
	.plugin('compression')
	.plugin('static', route: true)
	.plugin('request')
	.start('http', port)
	.unref()

Crixalis.staticPath = 't'
Crixalis.cachePath  = 't/tmp_' + port

# Enable streaming for small files
Crixalis._streamLimit = 0

try
	fs.mkdirSync('t/tmp_' + port)
catch error
	console.warn error

(require 'vows')
	.describe('stream-compression')
	.addBatch
		basic:
			topic: ->
				params =
					host: 'localhost'
					port: port
					path:  __filename.replace(/^.*(?=\/)/, '')
					headers: 'accept-encoding': '*'

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

	.export(module)
