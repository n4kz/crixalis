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

	setTimeout =>
		@render()

	return

hme = ->
	assert Array.isArray @events, 'events array not exists'
	@compression = no
	@events.push 'main'
	@error new Error 'test'

	setTimeout =>
		@render()

	return

hmec = ->
	assert Array.isArray @events, 'events array not exists'
	@events.push 'main'
	@error new Error 'test'

	setTimeout =>
		@render()

	return

hmc = ->
	assert Array.isArray @events, 'events array not exists'
	@events.push 'main'

	setTimeout =>
		@render()

	return

ha = ->
	assert not Array.isArray @events, 'events array exists'
	@events      = ['auto']
	@code        = 200
	@body        = @url.replace /^.*\//, ''
	@name        = @body

	@select()

	return

hd = ->
	assert Array.isArray @events, 'events array not exists'

	unless @name.match /^a?dcompression/
		@compression = no

	@events.push 'default'

	setTimeout =>
		@render()

	return

hr = ->
	assert Array.isArray @events, 'events array not exists'
	@events.push 'response'

	return

hs = ->
	assert Array.isArray @events, 'events array not exists'
	@events.push 'destroy'

	return

he = ->
	assert Array.isArray @events, 'events array not exists'
	@events.push 'error'

	return

hc = ->
	assert Array.isArray @events, 'events array not exists'
	@events.push 'compression'

	return

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
				Crixalis
					.route('/match/normal', hmn)
					.route('/match/compression', hmc)
					.route('/match/ecompression', hmec)
					.route('/match/error', hme)

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
					'normal',
					'default',
					'error',
					'compression',
					'ecompression',
					'dcompression'
				]

				for path in endpoints
					remains++
					options = copy params
					options.path = '/match/' + path

					options.headers =
						'accept-encoding': 'gzip'

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

	.export module
