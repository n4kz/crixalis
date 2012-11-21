assert = require 'assert'
http   = require 'http'
vows   = require 'vows'
fetch  = require './lib/fetch.js'
copy   = require './lib/copy.js'
c      = new (require '../lib/controller.js')()

server = http
	.createServer(c.handler())
	.listen 3000

c.router('/')
	.to ->
		assert Array.isArray @types
		assert.equal @types.length, @params.types
		@body = @types.join ':'

c.router('/_')
	.set
		types: ['text/javascript', 'application/javascript']
	.to ->
		assert Array.isArray @types
		assert.equal @types.length, @params.types
		@body = @types.join '|'

c.router('/_')
	.set
		types: ['image/png', 'custom/type']
	.to ->
		assert Array.isArray @types
		assert.equal @types.length, @params.types
		@body = @types.join '%'

vows
	.describe('accept')
	.addBatch
		simple:
			topic:
				host: '127.0.0.1'
				port: 3000
				path: '/?types=0'

			empty:
				topic: (topic) ->
					params = copy topic
					fetch params, @callback
					undefined

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 200
					assert.equal response.body, ''

			zero:
				topic: (topic) ->
					params = copy topic
					params.headers = accept: ''
					fetch params, @callback
					undefined

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 200
					assert.equal response.body, ''

			one:
				topic: (topic) ->
					params = copy topic
					params.headers = accept: 'application/javascript'
					params.path = '/?types=1'
					fetch params, @callback
					undefined

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 200
					assert.equal response.body, 'application/javascript'

			four:
				topic: (topic) ->
					params = copy topic
					params.headers = accept: 'text/html, text/plain, text/css'
					params.path = '/?types=3'
					fetch params, @callback
					undefined

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 200
					assert.equal response.body, 'text/html:text/plain:text/css'

		priority:
			topic:
				host: '127.0.0.1'
				port: 3000
				path: '/?types=1'

			float:
				topic: (topic) ->
					params = copy topic
					params.headers = accept: 'text/html;q=0.1'
					fetch params, @callback
					undefined

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 200
					assert.equal response.body, 'text/html'

			integer:
				topic: (topic) ->
					params = copy topic
					params.headers = accept: 'text/html;q=1'
					fetch params, @callback
					undefined

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 200
					assert.equal response.body, 'text/html'

			zero:
				topic: (topic) ->
					params = copy topic
					params.headers = accept: 'text/html;q=0'
					params.path = '/?types=0'
					fetch params, @callback
					undefined

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 200
					assert.equal response.body, ''

			multi:
				topic: (topic) ->
					params = copy topic
					params.path = '/?types=3'
					params.headers = accept: 'text/html;q=0, text/plain;level=1;q=0.1, text/javascript;q=0.2, application/javascript'
					fetch params, @callback
					undefined

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 200
					assert.equal response.body, 'application/javascript:text/javascript:text/plain'

		type:
			topic:
				host: '127.0.0.1'
				port: 3000
				path: '/_?types=1'

			first:
				topic: (topic) ->
					params = copy topic
					params.headers = accept: 'text/javascript'
					fetch params, @callback
					undefined

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 200
					assert.equal response.body, 'text/javascript'

			second:
				topic: (topic) ->
					params = copy topic
					params.headers = accept: 'application/javascript'
					fetch params, @callback
					undefined

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 200
					assert.equal response.body, 'application/javascript'

			none:
				topic: (topic) ->
					params = copy topic
					params.headers = accept: 'text/html'
					fetch params, @callback
					undefined

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 404

			priority:
				topic: (topic) ->
					params = copy topic
					params.headers = accept: 'text/html;q=0, text/javascript;q=1, application/javascript;q=0.7'
					params.path = '/_?types=2'
					fetch params, @callback
					undefined

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 200
					assert.equal response.body, 'text/javascript|application/javascript'

		subtype:
			topic:
				host: '127.0.0.1'
				port: 3000
				path: '/_?types=1'

			first:
				topic: (topic) ->
					params = copy topic
					params.headers = accept: 'image/*'
					fetch params, @callback
					undefined

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 200
					assert.equal response.body, 'image/*'

			second:
				topic: (topic) ->
					params = copy topic
					params.headers = accept: 'application/json, custom/*'
					params.path = '/_?types=2'
					fetch params, @callback
					undefined

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 200
					assert.equal response.body, 'application/json%custom/*'

			fail:
				topic: (topic) ->
					params = copy topic
					params.headers = accept: 'archive/*, video/mpg'
					fetch params, @callback
					undefined

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 404

			wildcard:
				topic: (topic) ->
					params = copy topic
					params.headers = accept: '*/*'
					fetch params, @callback
					undefined

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 200
					assert.equal response.body, '*/*'

	.export module
