assert   = require 'assert'
vows     = require 'vows'
http     = require 'http'
copy     = require './lib/copy.js'
fetch    = require './lib/fetch.js'
Crixalis = require '../lib/controller.js'

hmn = ->
	assert Array.isArray @events, 'event array not exists'
	@compression = no
	@events.push 'main'

hme = ->
	assert Array.isArray @events, 'events array not exists'
	@compression = no
	@events.push 'main'
	@error new Error 'test'

hmec = ->
	assert Array.isArray @events, 'events array not exists'
	@events.push 'main'
	@error new Error 'test'

hmc = ->
	assert Array.isArray @events, 'events array not exists'
	@events.push 'main'

ha = ->
	assert not Array.isArray @events, 'events array exists'
	@events      = ['auto']
	@code        = 200
	@body        = @url.replace /^.*\//, ''
	@name        = @body

	@select()

hd = ->
	assert Array.isArray @events, 'events array not exists'

	if @name isnt 'dcompression'
		@compression = no

	@events.push 'default'

hr = ->
	assert Array.isArray @events, 'events array not exists'
	@events.push 'response'

hs = ->
	assert Array.isArray @events, 'events array not exists'
	@events.push 'destroy'

he = ->
	assert Array.isArray @events, 'events array not exists'
	@events.push 'error'

hc = ->
	assert Array.isArray @events, 'events array not exists'
	@events.push 'compression'

server = http
	.createServer(Crixalis.handler)
	.listen 3000

vows
	.describe('events')
	.addBatch
		order:
			topic: () ->
				responses = {}
				remains   = 0
				params    =
					host: '127.0.0.1'
					port: 3000

				cb = (error, result) =>
					assert not error,                      'got result'
					assert.equal result.statusCode, 200,   'code 200'

					unless --remains
						@callback undefined, responses

				# Load compression plugin
				Crixalis.plugin 'compression'

				# Add some routes
				Crixalis.router()
					.from('/match/normal').to(hmn)
					.from('/match/compression').to(hmc)
					.from('/match/ecompression').to(hmec)
					.from('/match/error').to(hme)

				# Setup new listeners
				Crixalis.on 'auto', ha
				Crixalis.on 'response', hr
				Crixalis.on 'default', hd
				Crixalis.on 'error', he
				Crixalis.on 'compression', hc
				Crixalis.on 'destroy', ->
					hs.call @
					responses[@name] = @events

				for path in 'normal default error compression ecompression dcompression'.split ' '
					remains++
					options = copy params
					options.path = '/match/' + path

					options.headers =
						'accept-encoding': 'gzip'

					fetch options, cb

				undefined

			normal: (error, responses) ->
				events = responses.normal
				assert.deepEqual events, 'auto main response destroy'.split ' '

			error: (error, responses) ->
				events = responses.error
				assert.deepEqual events, 'auto main error response destroy'.split ' '

			default: (error, responses) ->
				events = responses.default
				assert.deepEqual events, 'auto default response destroy'.split ' '

			compression: (error, responses) ->
				events = responses.compression
				assert.deepEqual events, 'auto main compression response destroy'.split ' '

			ecompression: (error, responses) ->
				events = responses.ecompression
				assert.deepEqual events, 'auto main error compression response destroy'.split ' '

			dcompression: (error, responses) ->
				events = responses.dcompression
				assert.deepEqual events, 'auto default compression response destroy'.split ' '

			# TODO: same for async

	.export module
