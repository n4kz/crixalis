Crixalis = require('../../lib/controller').self
i = 0

module.exports = (options) ->
	Crixalis._ 'plugin_' + ++i, ->
		return options
