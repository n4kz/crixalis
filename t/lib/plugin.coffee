Crixalis = require('../../lib/controller')
i = 0

module.exports = (options) ->
	Crixalis.define 'method', 'plugin_' + ++i, ->
		return options
