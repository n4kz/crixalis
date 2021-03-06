assert   = require 'assert'
vows     = require 'vows'
copy     = require './lib/copy'
fetch    = require './lib/fetch'
port     = +process.env.CRIXALIS_PORT + 4
Crixalis = require '../lib/crixalis'

CxA = new Crixalis()
CxB = new Crixalis()

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
	@stash.name  = @body

	@select()

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

CxA
	.start 'http', port + 0
	.unref()

CxB
	.plugin 'compression'
	.start 'http', port + 100
	.unref()

vows
	.describe('events')
	.addBatch
		normal:
			topic: ->
				responses = {}
				remains   = 0
				params    =
					host: '127.0.0.1'
					port: port + 0

				cb = (error, result) =>
					assert not error,                    'got result'
					assert.equal result.statusCode, 200, 'code 200'

					unless --remains
						@callback null, responses

					return

				# Add some routes
				CxA
					.route('/match/normal', hmn)
					.route('/match/error', hme)
					.route('/match/compression', hmc)
					.route('/match/ecompression', hmec)

				# Setup new listeners
				CxA.on 'auto', ha
				CxA.on 'response', hr
				CxA.on 'error', he
				CxA.on 'compression', hc
				CxA.on 'destroy', hs
				CxA.on 'destroy', -> responses[@stash.name] = @events

				endpoints = [
					'normal',
					'error',
					'compression',
					'ecompression'
				]

				for path in endpoints
					remains++
					options = copy params
					options.path = '/match/' + path

					if /compression/.test path
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

			compression: (error, responses) ->
				events = responses.compression
				assert.deepEqual events, 'auto main response destroy'.split ' '

			ecompression: (error, responses) ->
				events = responses.ecompression
				assert.deepEqual events, 'auto main error response destroy'.split ' '

			feature: ->
				assert.isFalse CxA.has('compression')

		compression:
			topic: ->
				responses = {}
				remains   = 0
				params    =
					host: '127.0.0.1'
					port: port + 100

				cb = (error, result) =>
					assert not error,                    'got result'
					assert.equal result.statusCode, 200, 'code 200'

					unless --remains
						@callback null, responses

					return

				# Add some routes
				CxB
					.route('/match/normal', hmn)
					.route('/match/error', hme)
					.route('/match/compression', hmc)
					.route('/match/ecompression', hmec)

				# Setup new listeners
				CxB.on 'auto', ha
				CxB.on 'response', hr
				CxB.on 'error', he
				CxB.on 'compression', hc
				CxB.on 'destroy', hs
				CxB.on 'destroy', -> responses[@stash.name] = @events

				endpoints = [
					'normal',
					'error',
					'compression',
					'ecompression'
				]

				for path in endpoints
					remains++
					options = copy params
					options.path = '/match/' + path

					if /compression/.test path
						options.headers =
							'accept-encoding': 'gzip'

					fetch options, cb

				return

			normal: (error, responses) ->
				events = responses.normal
				assert.deepEqual events, 'auto main compression response destroy'.split ' '

			error: (error, responses) ->
				events = responses.error
				assert.deepEqual events, 'auto main error compression response destroy'.split ' '

			compression: (error, responses) ->
				events = responses.compression
				assert.deepEqual events, 'auto main compression response destroy'.split ' '

			ecompression: (error, responses) ->
				events = responses.ecompression
				assert.deepEqual events, 'auto main error compression response destroy'.split ' '

			feature: ->
				assert.isTrue CxB.has('compression')

	.export module
