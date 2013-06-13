assert = require 'assert'
c      = require '../lib/controller.js'

plugins =
	request:
		request: 'function'

	static:
		serve: 'function'
		cachePath: 'string'
		expires: 'object'
		_symlinks: 'boolean'
		_streamLimit: 'number'

	compression:
		compression: 'function'
		defaultCompression: 'string'

	jade:
		jade: 'function'
		jadePath: 'string'

	coffee:
		coffee: 'function'

	less:
		less: 'function'

	# processor is not listed here (is not a plugin but a plugin generator)

plan = ->
	result =
		topic: null

	for own plugin of plugins
		((plugin, exports) ->
			result[plugin] = ->
				for own property of exports
					assert.isUndefined c[property]

				assert.equal c, c.plugin(plugin)

				for own property of exports
					assert.equal typeof c[property], exports[property]

				return
			return
		)(plugin, plugins[plugin])

	return result

(require 'vows')
	.describe('plugin')
	.addBatch
		core: plan()

		external:
			topic: null

			'path resolution': ->
				assert.isUndefined c.plugin_1
				assert.equal c, c.plugin(__dirname + '/lib/plugin')
				assert.isFunction c.plugin_1

			'plugin options': ->
				options =
					test: 'property'

				assert.isUndefined c.plugin_2
				assert.equal c, c.plugin(__dirname + '/lib/plugin', options)
				assert.isFunction c.plugin_2
				assert.notEqual c.plugin_1, c.plugin_2
				assert.notEqual c.plugin_1(), c.plugin_2()
				assert.deepEqual options, c.plugin_2()

			'loader error#not found': ->
				assert.throws ->
					c.plugin(__dirname + 'notexists')

			'loader error#bad plugin': ->
				assert.throws ->
					c.plugin(__dirname + '/lib/module')

	.export module
