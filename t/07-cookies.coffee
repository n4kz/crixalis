assert   = require 'assert'
fetch    = require './lib/fetch'
copy     = require './lib/copy'
port     = +process.env.CRIXALIS_PORT + 7
Crixalis = require '../lib'

Crixalis
	.route '/set', ->
		@cookie
			name: 'first'
			value: 256
			domain: 'example.com'

		@cookie
			name: 'second'
			value: '123DFIQWE'
			path: '/set'

		@cookie
			name: 'third'
			value: 'frfr'
			http: no
			secure: yes

		time = new Date()

		@cookie
			name: 'fourth'
			value: '753'
			expires: time

		@cookie
			name: 'expired'
			value: null

		assert.deepEqual this.headers,
			'Set-Cookie': [
				'first=256; domain=example.com; httponly',
				'second=123DFIQWE; path=/set; httponly',
				'third=frfr; secure',
				"fourth=753; expires=#{ time.toUTCString() }; httponly",
				"expired=; expires=#{ new Date(0).toUTCString() }; httponly"
			]

		@render()
		return

	.route '/get', ->
		assert.equal @cookies.test, 3124
		assert.equal @cookies.foo, 'ok'
		assert.equal Object.keys(@cookies).length, 2

		@render()
		return

	.start 'http', port
	.unref()

(require 'vows')
	.describe('cookies')
	.addBatch
		cookie:
			topic:
				host: '127.0.0.1'
				port: port
				path: '/set'

			set:
				topic: (topic) ->
					params = copy topic

					fetch params, @callback

					return

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 204

			get:
				topic: (topic) ->
					params = copy topic
					params.headers =
						'Cookie': 'test=3124; foo=ok'

					fetch params, @callback

					return

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 204
	.export(module)
