assert = require 'assert'
fetch  = require './lib/fetch.js'
c      = require '../lib/controller.js'

port = process.env.CRIXALIS_PORT

c.start 'http', port

dummy = ->

parts = ['alpha', 'bravo4_03', '_-_5690_i-', '$^', '(...', '+-*[#]']

(require 'vows')
	.describe('shortcuts')
	.addBatch
		'placeholders':
			topic: 'placeholders'

			one: () ->
				(route = c.router().from('/:item/list'))
					.to(dummy)

				for item in parts
					context =
						params: {}
						url: "/#{item}/list"

					assert route.match context
					assert.equal context.params.item, item

			two: (topic) ->
				(route = c.router().from('/:item/:action'))
					.to(dummy)

				for item in parts
					for action in parts
						context =
							params: {}
							url: "/#{item}/#{action}"

						assert route.match context
						assert.equal context.params.item,   item
						assert.equal context.params.action, action

			negative: (topic) ->
				(route = c.router().from('/:item'))
					.to(dummy)

				for item in parts
					for action in parts
						context =
							url: "/#{item}/#{action}"

						assert not route.match context

	.export module
