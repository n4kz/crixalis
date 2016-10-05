# Changelog

## 1.0.0

Released 2016-10-05

### Core

* Refactored core classes
* `.define()` no longer needs definition type
* `.define()` can declare views and features
* `.define()` can not attach event listeners anymore
* `.has()` can be used to test for implemented features
* Implemented direct route declaration using `.route()`
* Implemented instance isolation
* Implemented feature declaration
* Implemented view declaration
* Implemented `*` support for routes
* Implemented `auto` view
* Implemented __Accept__-based response for default error handler
* Removed deprecated code
* Removed `.router()`
* Removed syncronous routes and `.async` flag
* Removed __default__ event
* Removed route hashMap, all routes now are compiled to RegExp
* Removed `._routes`, `._patterns` and `._views`
* Removed `.is_get()` and others
* Removed `.chain()`
* Removed `.view` property and all views except `auto`
* Renamed `._response()` to `.sendResponse()`
* Renamed `._destroy()` to `.destroyContext()`
* Renamed `._handler()` to `.createContext()`
* Renamed `Context.start` to `Context.stamp` (conflict with `.start()`)
* Fixed _Content-Type_-based routes
* Fixed `:placeholder` RegExp to not accept dots

### Plugins

* Implemented _ETag_ support for static plugin
* Removed plugins for content translation (coffee, less, jade)
* Compression plugin declares `feature::compression` when loaded
* Static plugin declares `feature::static` when loaded
* Static plugin has more obvious default properties
* Shortcuts plugin lost `.any()` method
