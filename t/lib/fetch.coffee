http = require 'http'
module.exports = (params, callback) ->
	http.get params, (response) ->
		response.body = ''
		response
			.on 'error', (error) ->
				callback error
			.on 'data', (chunk) ->
				response.body += chunk
			.on 'end', ->
				callback null, response
