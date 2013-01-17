# Crixalis

Lightweight web framework for node.js

# Synopsis

General usage

```js

var Crixalis = require('crixalis');

Crixalis
	.router({
		methods: ['GET', 'HEAD']
	})
	.from(/^\/$/).to(function () {
		this.redirect('/hello');
	})
	.from('/hello').to(function () {
		this.view = 'json';
		this.stash.json = {
			message: 'Hello, World!'
		};
	});

require('http')
	.createServer(Crixalis.handler)
	.listen(8080);

```

# Documentation

Complete API docs for latest version are available [here](http://crixalis.n4kz.com).

You can generate docs yourself for offline browsing using `make docs` command.

# Plugins

- `static`      Serve static files
- `compression` Compress response using `gzip` or `deflate` compression (also works with `static` plugin)
- `jade`        Use [jade](http://jade-lang.com) template engine
- `coffee`      Compile [coffee](http://coffeescript.org) for frontend on the fly
- `less`        Compile [less](http://lesscss.org) for frontend on the fly

# Copyright and License

Copyright 2012, 2013 Alexander Nazarov. All rights reserved.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
