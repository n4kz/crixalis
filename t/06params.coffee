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
	methods: ['GET', 'POST']

.from('/')
.to ->
	assert @is_get
	assert.equal typeof @params, 'object'
	assert.equal Object.keys(@params).length, 0

.from('/get')
.to ->
	assert @is_get
	assert.equal @params.p1, 1
	assert.equal @params.p2, 2
	assert.equal @params.p3, 3
	assert.equal Object.keys(@params).length, 3

.from('/post')
.to ->
	assert @is_post
	assert.equal @params.p1, 3
	assert.equal @params.p2, 1
	assert.equal @params.p3, 2
	assert.equal Object.keys(@params).length, 3

.from('/post4')
.to ->
	assert @is_post
	assert.equal Object.keys(@params).length, 3
	@body = [@params.p1, @params.p2, @params.p3].join(' ')

vows
	.describe('params')
	.addBatch
		params:
			topic:
				host: '127.0.0.1'
				port: 3000
				path: '/'

			none:
				topic: (topic) ->
					params = copy topic
					fetch params, @callback
					undefined

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 200

			get1:
				topic: (topic) ->
					params = copy topic
					params.path = '/get?p1=1;p2=2;p3=3'
					fetch params, @callback
					undefined

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 200

			get2:
				topic: (topic) ->
					params = copy topic
					params.path = '/get?p1=1&p2=2&p3=3'
					fetch params, @callback
					undefined

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 200

			post1:
				topic: (topic) ->
					params = copy topic
					params.path = '/post?p1=3&p2=1&p3=2'
					params.method = 'POST'
					fetch params, @callback
					undefined

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 200

			post2:
				topic: (topic) ->
					params = copy topic
					params.path = '/post'
					params.method = 'POST'
					params.data = 'p1=3&p2=1&p3=2'
					fetch params, @callback
					undefined

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 200

			post3:
				topic: (topic) ->
					params = copy topic
					params.path = '/post?p1=7&p2=9&p3=12'
					params.method = 'POST'
					params.data = 'p1=3&p2=1&p3=2'
					fetch params, @callback
					undefined

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 200

			post4:
				topic: (topic) ->
					params = copy topic
					params.path = '/post4?p1=7&p2=9&p3=12'
					params.method = 'POST'
					params.data = 'p1=3+5&p3=2+9'
					fetch params, @callback
					undefined

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 200
					assert.equal response.body, '3 5 9 2 9'

	.export module
