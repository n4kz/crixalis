http = require 'http'
module.exports = (params, callback) ->
	request = http.request params, (response) ->
		response.body = ''
		response
			.on 'error', (error) ->
				callback error
			.on 'data', (chunk) ->
				response.body += chunk
			.on 'end', ->
				callback null, response

	request.write params.data if params.data
	request.end()
