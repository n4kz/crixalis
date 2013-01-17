#!/usr/bin/node

var http = require('http'),
	c    = require('crixalis'),
	port = 3000,
	root = './doc';

c
	.plugin('static')
	.plugin('compression')

c.expires = {
	'application/javascript' : 8.64E+8,
	'text/css'               : 8.64E+8,
	'image/gif'              : 8.64E+9,
	'image/png'              : 8.64E+9
};

c.on('auto', function () {
	console.log('Got ' + this.method + ' request to ' + this.url + ' from ' + this.address);
	this.select();
});

c.router({
	async: true,
	methods: ['GET', 'HEAD']
}).from(/^(.*)$/).to(function () {
	var file = root + '/' + this.params.$1
		.replace(/^\/*/, '')
		.replace(/\.\.\//g, '\/'),
		that = this;

	if (this.params.path === '/') {
		file += 'index.html';
	}

	this.serve(file, function (error) {
		if (error) {
			that.error(error);
		}
	});
});

server = http.createServer(c.handler).listen(port);
