#!/usr/bin/env node

var Crixalis = require('../lib/controller.js');

Crixalis
	.plugin('static')
	.plugin('shortcuts')
	.plugin('compression');

Crixalis.staticPath = 'doc';

Crixalis
	.on('auto', function () {
		console.log('Got ' + this.method + ' request to ' + this.url + ' from ' + this.address);
		this.select();
	})
	.router()
	.get('/', function () {
		this.async = true;
		this.serve(this.staticPath + '/index.html');
	});

Crixalis.start('http', 3000);
