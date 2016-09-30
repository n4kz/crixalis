assert   = require 'assert'
fetch    = require './lib/fetch.js'
Crixalis = require '../lib/controller.js'

port = +process.env.CRIXALIS_PORT + 15

Crixalis.start 'http', port
	.unref()

dummy = ->

parts = ['alpha', 'bravo4_03', '_-_5690_i-', '+', '55']

(require 'vows')
	.describe('shortcuts')
	.addBatch
		placeholders:
			topic: 'placeholders'

			one: ->
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

			two: ->
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

			escape: ->
				Crixalis.router()
					.from('/([^\/]+)/:action')
					.to(dummy)

				route = Crixalis._routes.pop()

				for item in parts
					for action in parts
						context = url: "/#{item}/#{action}"

						assert not route.match context

			invalid: ->
				Crixalis.router()
					.from('/([^\\//:action')
					.to(dummy)

				route = Crixalis._routes.pop()

				for item in parts
					for action in parts
						context =
							url: "/#{item}/#{action}"

						assert not route.match context

			negative: ->
				Crixalis.router()
					.from('/test/:item')
					.to(dummy)

				route = Crixalis._routes.pop()

				for item in parts
					for action in parts
						context =
							url     : "/#{item}/#{action}"
							params  : {}

						assert not route.match context

				assert not route.match url: '/test/file.jpg', params: {}
				assert     route.match url: '/test/file',     params: {}

			'asterisk#middle': ->
				Crixalis.router()
					.from('/*/alpha')
					.to(dummy)

				route = Crixalis._routes.pop()

				for item in parts
					for action in parts
						context = url: "/#{item}/#{action}"

						if action is 'alpha'
							assert route.match context
						else
							assert not route.match context

			'asterisk#end': ->
				Crixalis.router()
					.from('/alpha/*')
					.to(dummy)

				route = Crixalis._routes.pop()

				for item in parts
					for action in parts
						context = url: "/#{item}/#{action}"

						if item is 'alpha'
							assert route.match context
						else
							assert not route.match context

			'asterisk#double': ->
				Crixalis.router()
					.from('/*/test/*')
					.to(dummy)

				route = Crixalis._routes.pop()

				for item in parts
					for action in parts
						context = url: "/#{item}/test/#{action}"

						assert route.match context

				assert not route.match url: '/notesthere'
				assert not route.match url: '/abc/test/'
				assert not route.match url: '//test/abc'

			everything: ->
				Crixalis.router()
					.from('*')
					.to(dummy)

				route = Crixalis._routes.pop()

				for item in parts
					for action in parts
						context = url: "/#{item}/#{action}"

						assert route.match context

			tail: ->
				Crixalis.router()
					.from('*/:tail')
					.to(dummy)

				route = Crixalis._routes.pop()

				for item in parts
					for action in parts
						context =
							params : {}
							url    : "/#{item}/#{action}"

						assert route.match context
						assert.equal context.params.tail, action

	.export module
