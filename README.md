just-login-core
===============

[![Build Status](https://travis-ci.org/coding-in-the-wild/just-login-core.svg)](https://travis-ci.org/coding-in-the-wild/just-login-core)

Handles tokens for just-login.

# Example

```js
var JustLoginCore = require('just-login-core')
var db = require('level')('./databases/core')
var core = JustLoginCore(db)

router.get('/login', function (req, res) {
	var query = url.parse(req.url, true).query

	var successHtml = '<p>U shud receiv email within few minutez...</p>'
	core.beginAuthentication(query.sessionId, query.email, sendResponse(res, successHtml))
})

router.get('/authenticate', function (req, res) {
	var query = url.parse(req.url, true).query

	core.authenticate(query.token, sendResponse(res, '<p>U r nao loggd in!!!</p>'))
})

function sendResponse(res, successHtml) {
	return function onRequest(err) {
		if (err) {
			res.writeHead(500, { 'Content-Type': 'text/plain' })
			res.end(err.message)
		} else {
			res.writeHead(200, { 'Content-Type': 'text/html' })
			res.end(successHtml)
		}
	}
}
```

# API

```js
var Core = require('just-login-core')
```

## `var core = JustLoginCore(db[, options])`

- `db` is expecting a levelup database.
- `options` is an object that holds the (**gasp**) options!
	- `tokenGenerator` is expecting a function that returns an unique string each time it is called. This is used for token generation. Defaults to a UUID generator.
	- `tokenTtl` is a number in milliseconds of a token's Time To Live (TTL). Defaults to 5 minutes.
	- `tokenTtlCheckIntervalMs` is a number in milliseconds of the ttl's check interval. (See [tiny-level-ttl][tinyttl], `checkInterval`.) Defaults to 10 seconds.
- Returns `core`.

## `core`

It emits some [events](#core-events) and has a few methods:

## `core.beginAuthentication(sessionId, contactAddress[, cb])`

Starts the authentication process by emitting the 'authentication initiated' event with a token and the contact address.

Something else must listen for the event, and send a message to the user. See [`core` events](#core-events) for more information.

- `sessionId` is a string of the session id that is trying to get authenticated.
- `contactAddress` is string of the user's contact info, (usually an email address).
- `cb` is a function with the following arguments:
	- `err` is an Error object or null.
	- `authReqInfo` is an object with the authentication request information (or null if an error occurred). The object is identical to the object emitted in the event, with the following properties:
		- `contactAddress` is a string with the contact address.
		- `token` is a string of the token.

Emits `core.on('authentication initiated', function (authReqInfo) { ... })`

```js
core.beginAuthentication('session id', 'fake@example.com', function (err, authReqInfo) {
	if (!err) {
		console.log(authReqInfo.token) //logs the token
		console.log(authReqInfo.contactAddress) //logs: "fake@example.com"
	}
})
```

## `core.authenticate(token[, cb])`

Authenticates the token, and calls back with the session id and contact address associated with that token. Then the token and it's associated data is deleted. A token can only be authenticated once.

- `token` is a string of the token that is trying to get authenticated.
- `cb` is a function with the following arguments:
	- `err` is an Error object or null.
	- `credentials` is null is the user is not authenticated, and is an object if they are authenticated:
		-  `contactAddress` is a string of their contact address.
		-  `sessionId` is a string of their session id.

Emits `core.on('authenticated', function (credentials) { ... })`

```js
core.authenticate('the token', function(err, credentials) {
	if (!err) {
		console.log(credentials.contactAddress + ' is now logged in! Congratulations!')
	} else {
		console.log('Sorry, for some reason you are not logged in.')
	}
})
```

## `core` events

### `authentication initiated`

Emitted when `beginAuthentication()` is called. (Which should be when the user clicks the "login" button.)

```js
core.on('authentication initiated', function (authReqInfo) {
	console.log(authReqInfo.contactAddress)
	console.log(authReqInfo.token)
})
```

_(You can use [just-login-emailer][jlemailer] to catch this event.)_

### `authenticated`

Emitted when `core.authenticate()` is successful.

```js
core.on('authenticated', function (credentials) {
	console.log(credentials.contactAddress)
	console.log(credentials.sessionId)
})
```

# Install

Install with [npm](https://nodejs.org/en/download):

	npm install just-login-core

# License

[VOL](http://veryopenlicense.com/)


[beginauth]: #corebeginauthenticationsessionid-contactaddress-cb
[auth]: #coreauthenticatetoken-cb
[tinyttl]: https://github.com/ArtskydJ/tiny-level-ttl#ttldb-opts
[checkint]: https://github.com/tehshrike/expire-unused-keys#timeoutms-db-checkintervalms
[jlemailer]: https://github.com/coding-in-the-wild/just-login-emailer
