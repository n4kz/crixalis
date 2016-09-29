assert   = require 'assert'
fetch    = require './lib/fetch.js'
Crixalis = require '../lib/controller.js'

port = +process.env.CRIXALIS_PORT + 15

Crixalis.start 'http', port
	.unref()

dummy = ->

parts = ['alpha', 'bravo4_03', '_-_5690_i-', '$^', '(...', '+-*[#]', 55]

(require 'vows')
	.describe('shortcuts')
	.addBatch
		'placeholders':
			topic: 'placeholders'

			one: () ->
				Crixalis.router()
					.from('/:item/list')
					.to(dummy)

				route = Crixalis._routes.pop()

				for item in parts
					context =
						params: {}
						url: "/#{item}/list"

					assert route.match context
					assert.equal context.params.item, item

			two: (topic) ->
				Crixalis.router()
					.from('/:item/:action')
					.to(dummy)

				route = Crixalis._routes.pop()

				for item in parts
					for action in parts
						context =
							params: {}
							url: "/#{item}/#{action}"

						assert route.match context
						assert.equal context.params.item,   item
						assert.equal context.params.action, action

			escape: (topic) ->
				Crixalis.router()
					.from('/([^\/]+)/:action')
					.to(dummy)

				route = Crixalis._routes.pop()

				for item in parts
					for action in parts
						context =
							params: {}
							url: "/#{item}/#{action}"

						assert not route.match context

			invalid: (topic) ->
				Crixalis.router()
					.from('/([^\\//:action')
					.to(dummy)

				route = Crixalis._routes.pop()

				for item in parts
					for action in parts
						context =
							params: {}
							url: "/#{item}/#{action}"

						assert not route.match context

			negative: (topic) ->
				Crixalis.router()
					.from('/:item/5')
					.to(dummy)

				route = Crixalis._routes.pop()

				for item in parts
					for action in parts
						context =
							url: "/#{item}/#{action}"

						assert not route.match context

	.export module
