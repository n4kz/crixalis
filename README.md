# Crixalis 

Lightweight web framework for node.js

```js

var http = require('http'),
	c = new require('crixalis')(),
	port = 80;

c.router()
	.from(/^\/(?!hello)/)
	.to(function () {
		this.redirect('/hello');

		return true;
	})
	.from('/hello')
	.to(function () {
		this.view = 'json';
		this.stash.json = {
			message: 'Hello, World!'
		};

		return true;
	});

http.createServer(c.handler()).listen(port)


```
