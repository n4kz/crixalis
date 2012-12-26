# Crixalis

Lightweight web framework for node.js

# Synopsis

General usage

```js

var http = require('http'),
	c = new require('crixalis')(),
	port = 80;

c.on('default', function () {
	this.code = 204;
	this.emit('end');
});

c.router()
	.from(/^\/$/)
	.to(function () {
		this.redirect('/hello');
	})
	.from('/hello')
	.to(function () {
		this.view = 'json';
		this.stash.json = {
			message: 'Hello, World!'
		};
	});

http.createServer(c.handler()).listen(port)

```

Auto action

```js

c.on('auto', function () {
	console.log('Got ' + this.method + ' request to ' + this.url + ' from ' + this.address);
	this.select();
});

```

Async

```js

var fs = require('fs');

c.router()
	.set('async', true)
	.from('/')
	.to(function () {
		var that = this;

		fs.readFile('index.html', function (error, data) {
			if (error) {
				that.emit('error', error);
			} else {
				that.body = data;
				that.render();
			}
		});
	});

```

Plugins

```js

c.plugin('./plugins/static');

c.router({
	async: true,
	pattern: /^(.*)$/,
	capture: {
		'$1': 'path'
	}
}).to(function () {
	var file = './public' + this.params.path;

	this.serve(file);
});

```
