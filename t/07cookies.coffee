assert = require 'assert'
http   = require 'http'
vows   = require 'vows'
fetch  = require './lib/fetch.js'
copy   = require './lib/copy.js'
c      = require '../lib/controller.js'

server = http
	.createServer(c.handler)
	.listen 3000

c.router
	url: '/set'
.to ->
	@cookie
		name: 'first'
		value: 256
		domain: '.localhost'
	.cookie
		name: 'second'
		path: '/set'
		value: '123DFIQWE'
		domain: '.localhost'

	assert.deepEqual this.headers,
		'Set-Cookie': [
			'first=256; domain=.localhost',
			'second=123DFIQWE; domain=.localhost; path=/set'
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
				port: 3000
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
