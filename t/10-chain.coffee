assert = require 'assert'
c      = require '../lib/controller.js'
Chain  = require '../lib/chain.js'

(require 'vows')
	.describe('chain')
	.addBatch
		constructor:
			topic: new Chain()

			object: (b) ->
				assert b         instanceof Chain
				assert c.chain() instanceof Chain

				assert b         isnt c.chain()
				assert c.chain() isnt c.chain()

			properties: (b) ->
				assert b.lock

				assert Array.isArray b.queue
				assert Array.isArray b.results

				assert not b.queue.length
				assert not b.results.length

				assert b.error          is null
				assert typeof b.forward is 'function'
				assert typeof b.append  is 'function'
				assert typeof b.clean   is 'function'

			simple: (b) ->
				cx =
					counter: 0

				b.append context, cx, [cx]
				assert b.queue.length is 1
				b.forward()
				assert cx.counter is 1
				assert not Object.keys(b).length

		chain:
			topic: new Chain()

			flow: (b) ->
				b.counter = 0

				b.append inc, b
				b.append inc, b
				b.append inc, b
				b.append((->
					assert @results.length is 3
					assert @counter is 3
					assert @results.pop() is 3
					@forward()
				), b)

				b.forward()

			clean: (b) ->
				assert not Object.keys(b).length

		error:
			topic: new Chain()

			flow: (b) ->
				b.counter = 0

				b.error = (error) ->
					assert @counter is 2
					assert @results.length is 2
					assert @results.pop() is 2
					assert error is true

				b.append inc, b
				b.append inc, b

				b.append (next) ->
					next(true)

				b.append ->
					assert false

				b.forward()

			clean: (b) ->
				assert not Object.keys(b).length

		nofwd:
			topic: new Chain()

			flow: (b) ->
				b.append((->
					@forward()
				), b)
				b.append (next) ->
					next()
				b.append ->

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
