assert = require 'assert'
vows   = require 'vows'
fetch  = require './lib/fetch.js'
copy   = require './lib/copy.js'
c      = require '../lib/controller.js'
port   = process.env.CRIXALIS_PORT + 7

c.start 'http', port

c.router
	url: '/set'
.to ->
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
.set
	url: '/get'
.to ->
	assert.equal @cookies.test, 3124
	assert.equal @cookies.foo, 'ok'
	assert.equal Object.keys(@cookies).length, 2

vows
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
					undefined

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 200

			get:
				topic: (topic) ->
					params = copy topic
					params.headers =
						'Cookie': 'test=3124; foo=ok'
					fetch params, @callback
					undefined

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 200
	.export module
