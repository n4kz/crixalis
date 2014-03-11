assert = require 'assert'
vows   = require 'vows'
fetch  = require './lib/fetch.js'
copy   = require './lib/copy.js'
c      = require '../lib/controller.js'
port   = +process.env.CRIXALIS_PORT + 8

c.start 'http', port

c.router
	url: '/json'
.to ->
	@async = yes
	@view = 'json'
	@stash.json = body: 'html'
	setTimeout @render.bind(@), 50
	return
.set
	url: '/html'
.to ->
	@async = yes
	@body = 'html'
	setTimeout @render.bind(@), 30
	return
.set
	url: '/callback'
.to ->
	@body = 'callback'
	@async = yes
	setTimeout @render.bind(@), 40
	return
.set
	url: '/skip'
.to ->
	no

vows
	.describe('async')
	.addBatch
		route:
			topic:
				host: '127.0.0.1'
				port: port
				path: '/html'

			html:
				topic: (topic) ->
					params = copy topic
					fetch params, @callback
					undefined

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 200
					assert.equal response.body, 'html'

			json:
				topic: (topic) ->
					params = copy topic
					params.path = '/json'
					fetch params, @callback
					undefined

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 200
					assert.equal response.body, '{"body":"html"}'

			callback:
				topic: (topic) ->
					params = copy topic
					params.path = '/callback'
					fetch params, @callback
					undefined

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 200
					assert.equal response.body, 'callback'

			skip:
				topic: (topic) ->
					params = copy topic
					params.path = '/skip'
					fetch params, @callback
					undefined

				response: (error, response) ->
					assert not error
					assert.equal response.statusCode, 404

	.export module
