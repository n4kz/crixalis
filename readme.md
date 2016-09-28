# Crixalis

Lightweight web framework for node.js

# Features

- Small, documented and easily extendable core
- Advanced routing system (content type, method, host) with regexp support and placeholders
- Compression support (gzip, deflate)
- Static file serving support

# Synopsis

General usage

```js

var Crixalis = require('crixalis');

Crixalis

	/* Load plugin */
	.plugin('shortcuts')

	/* Get router object */
	.router()

	/* Add route with placeholder */
	.get('/hello/:name', function () {
		/* Prepare data for view */
		this.stash.json = {
			message: 'Hello, ' + this.params.name + '!'
		};

		/* Send result using json view */
		that.render('json');
	})

	/* Add simple route */
	.get('/info', function () {
		var that = this;

		require('fs').readFile('./package.json', function (error, result) {
			if (error) {
				/* Handle error */
				that.error(500);
			} else {
				/* Set response body */
				that.body = result;
			}

			/* Send result */
			that.render();
		});
	});

Crixalis

	/* Override default event handler */
	.on('default', function () {
		this.redirect('/hello/World');
		this.render();
	})

	/* Start server on port 8080 */
	.start('http', 8080);
```

# Plugins

Available core plugins

- `static`      Serve static files
- `compression` Compress response using `gzip` or `deflate` compression (also works with `static` plugin)
- `jade`        Use [jade](http://jade-lang.com) template engine
- `coffee`      Compile [coffee](http://coffeescript.org) for frontend on the fly
- `less`        Compile [less](http://lesscss.org) for frontend on the fly
- `request`     Thin wrapper around `http.request` and `https.request`
- `access`      Log requests to console
- `shortcuts`   Route declaration helpers, `.get()`, `.post()`, etc.

# Static server

Crixalis comes with script for serving static files

```bash
	# Start web server on port `3000` and serve files from `~/www/`
	crixalis --port 3000 --path ~/www/

	# Start web server on port `8080` and serve files from current folder
	crixalis
```

# Copyright and License

Copyright 2012-2016 Alexander Nazarov. All rights reserved.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
