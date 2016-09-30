assert   = require 'assert'
fetch    = require './lib/fetch.js'
Crixalis = require '../lib/controller.js'

port = +process.env.CRIXALIS_PORT + 15

Crixalis
	.start 'http', port
	.unref()

dummy = ->

parts = ['alpha', 'bravo4_03', '_-_5690_i-', '+', '55']

(require 'vows')
	.describe('shortcuts')
	.addBatch
		placeholders:
			topic: 'placeholders'

			one: ->
				route = Crixalis
					.route('/:item/list', dummy)
					._routes.pop()

				for item in parts
					context =
						params: {}
						url: "/#{item}/list"

					assert route.match context
					assert.equal context.params.item, item

			two: ->
				route = Crixalis
					.route('/:item/:action', dummy)
					._routes.pop()

				for item in parts
					for action in parts
						context =
							params: {}
							url: "/#{item}/#{action}"

						assert route.match context
						assert.equal context.params.item,   item
						assert.equal context.params.action, action

			escape: ->
				route = Crixalis
					.route('/([^\/]+)/:action', dummy)
					._routes.pop()

				for item in parts
					for action in parts
						context = url: "/#{item}/#{action}"

						assert not route.match context

			invalid: ->
				route = Crixalis
					.route('/([^\\//:action', dummy)
					._routes.pop()

				for item in parts
					for action in parts
						context =
							url: "/#{item}/#{action}"

						assert not route.match context

			negative: ->
				route = Crixalis
					.route('/test/:item', dummy)
					._routes.pop()

				for item in parts
					for action in parts
						context =
							url     : "/#{item}/#{action}"
							params  : {}

						assert not route.match context

				assert not route.match url: '/test/file.jpg', params: {}
				assert     route.match url: '/test/file',     params: {}

			'asterisk#middle': ->
				route = Crixalis
					.route('/*/alpha', dummy)
					._routes.pop()

				for item in parts
					for action in parts
						context = url: "/#{item}/#{action}"

						if action is 'alpha'
							assert route.match context
						else
							assert not route.match context

			'asterisk#end': ->
				route = Crixalis
					.route('/alpha/*', dummy)
					._routes.pop()

				for item in parts
					for action in parts
						context = url: "/#{item}/#{action}"

						if item is 'alpha'
							assert route.match context
						else
							assert not route.match context

			'asterisk#double': ->
				route = Crixalis
					.route('/*/test/*', dummy)
					._routes.pop()

				for item in parts
					for action in parts
						context = url: "/#{item}/test/#{action}"

						assert route.match context

				assert not route.match url: '/notesthere'
				assert not route.match url: '/abc/test/'
				assert not route.match url: '//test/abc'

			everything: ->
				route = Crixalis
					.route('*', dummy)
					._routes.pop()

				for item in parts
					for action in parts
						context = url: "/#{item}/#{action}"

						assert route.match context

			tail: ->
				route = Crixalis
					.route('*/:tail', dummy)
					._routes.pop()

				for item in parts
					for action in parts
						context =
							params : {}
							url    : "/#{item}/#{action}"

						assert route.match context
						assert.equal context.params.tail, action

	.export module
