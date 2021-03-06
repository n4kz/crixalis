assert   = require 'assert'
port     = +process.env.CRIXALIS_PORT + 16
Crixalis = require '../lib'

Crixalis
	.route '/', ->
		@view = 'json'
		@stash.json = status: 'ok'

		setTimeout((=>
			@render()
		), 50)

		return
	.plugin('request')
	.start('http', port)
	.unref()

(require 'vows')
	.describe('request')
	.addBatch
		timeout:
			topic: ->
				params =
					host: 'localhost'
					port: port
					timeout: 10

				Crixalis.request(params, @callback)

				return

			result: (error, result) -> assert.equal result, null
			error:  (error, result) ->
				assert.isObject error
				assert.equal error.message, 'Request timed out'

		normal:
			topic: ->
				params =
					host: 'localhost'
					port: port
					timeout: 100

				Crixalis.request(params, @callback)

				return

			error:  (error, result) -> assert.equal error, null
			result: (error, result) ->
				assert result?.message?.length
				assert.deepEqual JSON.parse(result.message.toString()), status: 'ok'

	.export(module)
