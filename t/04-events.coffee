assert   = require 'assert'
vows     = require 'vows'
copy     = require './lib/copy.js'
fetch    = require './lib/fetch.js'
Crixalis = require '../lib/controller.js'
port     = +process.env.CRIXALIS_PORT + 4

hmn = ->
	assert Array.isArray @events, 'event array not exists'
	@compression = no
	@events.push 'main'

	if @async
		setTimeout =>
			@render()

hme = ->
	assert Array.isArray @events, 'events array not exists'
	@compression = no
	@events.push 'main'
	@error new Error 'test'

	if @async
		setTimeout =>
			@render()

hmec = ->
	assert Array.isArray @events, 'events array not exists'
	@events.push 'main'
	@error new Error 'test'

	if @async
		setTimeout =>
			@render()

hmc = ->
	assert Array.isArray @events, 'events array not exists'
	@events.push 'main'

	if @async
		setTimeout =>
			@render()

ha = ->
	assert not Array.isArray @events, 'events array exists'
	@events      = ['auto']
	@code        = 200
	@body        = @url.replace /^.*\//, ''
	@name        = @body

	if @headers['x-async']
		@async = yes

	@select()

hd = ->
	assert Array.isArray @events, 'events array not exists'

	unless @name.match /^a?dcompression/
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

Crixalis.start 'http', port
	.unref()

vows
	.describe('events')
	.addBatch
		order:
			topic: ->
				responses = {}
				remains   = 0
				params    =
					host: '127.0.0.1'
					port: port

				cb = (error, result) =>
					assert not error,                    'got result'
					assert.equal result.statusCode, 200, 'code 200'

					unless --remains
						@callback true, responses

					return

				# Load compression plugin
				Crixalis.plugin 'compression'

				# Add some routes
				Crixalis.router()
					.from('/match/normal').to(hmn)
					.from('/match/compression').to(hmc)
					.from('/match/ecompression').to(hmec)
					.from('/match/error').to(hme)
					.from('/match/anormal').to(hmn)
					.from('/match/acompression').to(hmc)
					.from('/match/aecompression').to(hmec)
					.from('/match/aerror').to(hme)

				# Setup new listeners
				Crixalis.on 'auto', ha
				Crixalis.on 'response', hr
				Crixalis.on 'default', hd
				Crixalis.on 'error', he
				Crixalis.on 'compression', hc
				Crixalis.on 'destroy', ->
					hs.call @
					responses[@name] = @events

				endpoints = [
					'normal',   'default',  'error',  'compression',  'ecompression',  'dcompression'
					'anormal', 'adefault', 'aerror', 'acompression', 'aecompression', 'adcompression'
				]

				for path in endpoints
					remains++
					options = copy params
					options.path = '/match/' + path

					options.headers =
						'accept-encoding': 'gzip'

					if path.match /^a/
						options.headers['x-async'] = 'true'

					fetch options, cb

				return

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

			anormal: (error, responses) ->
				events = responses.anormal
				assert.deepEqual events, 'auto main response destroy'.split ' '

			aerror: (error, responses) ->
				events = responses.aerror
				assert.deepEqual events, 'auto main error response destroy'.split ' '

			adefault: (error, responses) ->
				events = responses.adefault
				assert.deepEqual events, 'auto default response destroy'.split ' '

			acompression: (error, responses) ->
				events = responses.acompression
				assert.deepEqual events, 'auto main compression response destroy'.split ' '

			aecompression: (error, responses) ->
				events = responses.aecompression
				assert.deepEqual events, 'auto main error compression response destroy'.split ' '

			adcompression: (error, responses) ->
				events = responses.adcompression
				assert.deepEqual events, 'auto default compression response destroy'.split ' '

			# TODO: same for async

	.export module
