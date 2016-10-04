i = 0

module.exports = (options) ->
	this.define 'plugin_' + ++i, ->
		return options

	return
