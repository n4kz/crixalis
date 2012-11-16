module.exports = (from, to = {}) ->
	to[key] = value for own key, value of from
	to
