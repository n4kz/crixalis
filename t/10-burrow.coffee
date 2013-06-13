assert = require 'assert'
vows   = require 'vows'
c      = require '../lib/controller.js'
Burrow = require '../lib/burrow.js'

vows
	.describe('burrow')
	.addBatch
		constructor:
			topic: new Burrow()

			object: (b) ->
				assert b          instanceof Burrow
				assert c.burrow() instanceof Burrow

				assert b          isnt c.burrow()
				assert c.burrow() isnt c.burrow()

			properties: (b) ->
				assert b.lock

				assert Array.isArray b.queue
				assert Array.isArray b.results

				assert not b.queue.length
				assert not b.results.length

				assert b.error          is null
				assert typeof b.forward is 'function'
				assert typeof b.tunnel  is 'function'
				assert typeof b.clean   is 'function'

			simple: (b) ->
				cx =
					counter: 0

				b.tunnel context, cx, [cx]
				assert b.queue.length is 1
				b.forward()
				assert cx.counter is 1
				assert not Object.keys(b).length

		chain:
			topic: new Burrow()

			flow: (b) ->
				b.counter = 0

				b.tunnel inc, b
				b.tunnel inc, b
				b.tunnel inc, b
				b.tunnel((->
					assert @results.length is 3
					assert @counter is 3
					assert @results.pop() is 3
					@forward()
				), b)

				b.forward()

			clean: (b) ->
				assert not Object.keys(b).length

		error:
			topic: new Burrow()

			flow: (b) ->
				b.counter = 0

				b.error = (error) ->
					assert @counter is 2
					assert @results.length is 2
					assert @results.pop() is 2
					assert error is true

				b.tunnel inc, b
				b.tunnel inc, b

				b.tunnel (next) ->
					next(true)

				b.tunnel ->
					assert false

				b.forward()

			clean: (b) ->
				assert not Object.keys(b).length

		nofwd:
			topic: new Burrow()

			flow: (b) ->
				b.tunnel((->
					@forward()
				), b)
				b.tunnel (next) ->
					next()
				b.tunnel ->

				b.forward()

			clean: (b) ->
				assert not Object.keys(b).length

	.export module

context = (cx, next) ->
	cx.counter++
	assert this        is cx
	assert typeof this is 'object'
	assert typeof next is 'function'
	next()

inc = ->
	@counter++
	@forward(null, @counter)
