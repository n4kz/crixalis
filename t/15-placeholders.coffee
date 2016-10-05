assert   = require 'assert'
fetch    = require './lib/fetch'
Crixalis = require '../lib'

port = +process.env.CRIXALIS_PORT + 15

Crixalis
	.start('http', port)
	.unref()

Crixalis.view = 'json'

request = (options) ->
	options.host   ?= 'localhost'
	options.port   ?= port
	options.path   ?= '/'
	options.method ?= 'GET'

	return ->
		fetch options, @callback
		return

matches = (expected) ->
	return (error, response) ->
		data = JSON.parse(response.body)

		assert.equal     expected.code, response.statusCode
		assert.deepEqual expected.data, JSON.parse(response.body)

# TODO: Indirect access
defineRoute = (route) ->
	Crixalis.route route, ->
		@params.route = String(route)
		@stash.json   = @params

		@render()

defineRoute route for route in [
	'/',
	'/static',
	'/static/:action',
	'/static/*',
	'/:item',
	'/:item/:action',
	'/:item/*',
	'*'
]

(require 'vows')
	.describe('placeholders')
	.addBatch
		root:
			topic: request
				path: '/'

			result: matches
				code: 200
				data:
					route: '/'

		static:
			topic: request
				path: '/static'

			result: matches
				code: 200
				data:
					route: '/static'

			action:
				topic: request
					path: '/static/index'

				result: matches
					code: 200
					data:
						route: '/static/:action'
						action: 'index'

			extension:
				topic: request
					path: '/static/index.txt'

				result: matches
					code: 200
					data:
						route: '/static/*'

			wildcard:
				topic: request
					path: '/static/files/index.txt'

				result: matches
					code: 200
					data:
						route: '/static/*'

		placeholder:
			topic: request
				path: '/index'

			result: matches
				code: 200
				data:
					route: '/:item'
					item: 'index'

			placeholder:
				topic: request
					path: '/index/files'

				result: matches
					code: 200
					data:
						route: '/:item/:action'
						item: 'index'
						action: 'files'

			extension:
				topic: request
					path: '/index/files.txt'

				result: matches
					code: 200
					data:
						route: '/:item/*'
						item: 'index'

			wildcard:
				topic: request
					path: '/index/files/list.txt'

				result: matches
					code: 200
					data:
						route: '/:item/*'
						item: 'index'

		extension:
			topic: request
				path: '/index.txt'

			result: matches
				code: 200
				data:
					route: '*'

	.export(module)
