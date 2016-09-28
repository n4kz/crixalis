assert   = require 'assert'
Crixalis = require '../lib/controller.js'
Chain    = require '../lib/chain.js'

(require 'vows')
	.describe('chain')
	.addBatch
		constructor:
			topic: new Chain()

			object: (chain) ->
				assert chain            instanceof Chain
				assert Crixalis.chain() instanceof Chain

				assert chain            isnt Crixalis.chain()
				assert Crixalis.chain() isnt Crixalis.chain()

			properties: (chain) ->
				assert chain.lock

				assert Array.isArray chain.queue
				assert Array.isArray chain.results

				assert not chain.queue.length
				assert not chain.results.length

				assert chain.error          is null
				assert typeof chain.forward is 'function'
				assert typeof chain.append  is 'function'
				assert typeof chain.clean   is 'function'

			simple: (chain) ->
				cx =
					counter: 0

				chain.append context, cx, [cx]
				assert chain.queue.length is 1
				chain.forward()
				assert cx.counter is 1

				assert.equal null, value for key, value of chain

		chain:
			topic: new Chain()

			flow: (chain) ->
				chain.counter = 0

				chain.append inc, chain
				chain.append inc, chain
				chain.append inc, chain
				chain.append((->
					assert @results.length is 3
					assert @counter is 3
					assert @results.pop() is 3
					@forward()
				), chain)

				chain.forward()

			clean: (chain) ->
				assert.equal null, value for key, value of chain

		error:
			topic: new Chain()

			flow: (chain) ->
				chain.counter = 0

				chain.error = (error) ->
					assert @counter is 2
					assert @results.length is 2
					assert @results.pop() is 2
					assert error is true

				chain.append inc, chain
				chain.append inc, chain

				chain.append (next) ->
					next(true)

				chain.append ->
					assert false

				chain.forward()

			clean: (chain) ->
				assert.equal null, value for key, value of chain

		nofwd:
			topic: new Chain()

			flow: (chain) ->
				chain.append((->
					@forward()
				), chain)
				chain.append (next) ->
					next()
				chain.append ->

				chain.forward()

			clean: (chain) ->
				assert.equal null, value for key, value of chain

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
