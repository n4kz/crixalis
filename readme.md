# Crixalis

Lightweight web framework for node.js

# Features

- Small, documented and easily extendable core
- Advanced routing system (content type, method, host) with RegExp support and placeholders
- Compression support (gzip, deflate)
- Static file serving support (with __ETag__, __Last-Modified__, __Expires__ and LRU-cache)

# Synopsis

General usage

```js

var Crixalis = require('crixalis');

Crixalis

	/* Load plugins */
	.plugin('shortcuts')
	.plugin('access', { format: '%7T %-4m %s %9B %-15h %U%q' })

	/* Add route with placeholder */
	.get('/hello/:name', function () {
		/* Prepare data for view */
		this.stash.json = {
			message: 'Hello, ' + this.params.name + '!'
		};

		/* Send result using json view */
		this.render('json');
	})

	/* Add another route for GET and HEAD methods */
	.route('/info', { methods: ['GET', 'HEAD'] }, function () {
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
	})

	/* Catch everything else */
	.route('*', function () {
		this.redirect('/hello/World');
		this.render();
	})

	/* Start server on port 8080 */
	.start('http', 8080);
```

# Plugins

Available core plugins

- `access`      Access log (with configurable CLF support)
- `compression` Compress response using `gzip` or `deflate` compression (also works with `static` plugin)
- `request`     Thin wrapper around `http.request` and `https.request`
- `shortcuts`   Route declaration helpers, `.get()`, `.post()`, etc.
- `static`      Serve static files

# Static server

Crixalis comes with script for serving static files

```bash
	# Start web server on port `8080` and serve files from current folder
	crixalis

	# Start web server on port `3000` and serve files from `~/www/`
	crixalis --port 3000 --path ~/www/
```

# Copyright and License

Copyright 2012-2016 Alexander Nazarov. All rights reserved.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
