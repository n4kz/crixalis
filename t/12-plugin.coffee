assert   = require 'assert'
Crixalis = require '../lib/controller.js'

plugins =
	request:
		request: 'function'

	static:
		serve: 'function'
		cachePath: 'string'
		expires: 'object'
		_streamLimit: 'number'

	compression:
		compression: 'function'
		defaultCompression: 'string'

try
	require 'jade'
catch error
	delete plugins.jade

try
	require 'less'
catch error
	delete plugins.less

plan = ->
	result =
		topic: null

	for own plugin of plugins
		((plugin, exports) ->
			result[plugin] = ->
				for own property of exports
					assert.isUndefined Crixalis[property]

				assert.equal Crixalis, Crixalis.plugin(plugin)

				for own property of exports
					assert.equal typeof Crixalis[property], exports[property]

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
				assert.isUndefined Crixalis.plugin_1
				assert.equal Crixalis, Crixalis.plugin(__dirname + '/lib/plugin')
				assert.isFunction Crixalis.plugin_1

			'plugin options': ->
				options =
					test: 'property'

				assert.isUndefined Crixalis.plugin_2
				assert.equal Crixalis, Crixalis.plugin(__dirname + '/lib/plugin', options)
				assert.isFunction Crixalis.plugin_2
				assert.notEqual Crixalis.plugin_1, Crixalis.plugin_2
				assert.notEqual Crixalis.plugin_1(), Crixalis.plugin_2()
				assert.deepEqual options, Crixalis.plugin_2()

			'loader error#not found': ->
				assert.throws ->
					Crixalis.plugin(__dirname + 'notexists')

			'loader error#bad plugin': ->
				assert.throws ->
					Crixalis.plugin(__dirname + '/lib/module')

	.export module
