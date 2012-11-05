#!/usr/bin/node

var http = require('http'),
	Crixalis = require('crixalis'),
	c = new Crixalis(),
	port = 3000,
	root = './doc';

c.plugin('./plugins/static');

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
	methods: ['GET', 'HEAD'],
	pattern: /^(.*)$/,
	capture: {
		'$1': 'path'
	}
}).to(function () {
	var file = root + '/' + this.params.path
		.replace(/^\/*/, '')
		.replace(/\.\.\//g, '\/'),
		that = this;

	if (this.params.path === '/') {
		file += 'index.html';
	}

	this.serve(file, function (error) {
		if (error) {
			that.emit('error', error);
		}
	});
});

server = http.createServer(c.handler()).listen(port);
