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
	url: '/json'
	async: yes
.to ->
	@view = 'json'
	@stash.json = body: 'html'
	setTimeout @render.bind(this), 50
	undefined
.set
	url: '/html'
.to ->
	@body = 'html'
	setTimeout @render.bind(this), 30
	undefined
.set
	async: false
	url: '/callback'
.to ->
	@body = 'callback'
	@async = yes
	setTimeout @render.bind(this), 40
	undefined
.set
	url: '/skip'
.unset('async')
.to ->
	no

vows
	.describe('async')
	.addBatch
		route:
			topic:
				host: '127.0.0.1'
				port: 3000
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
