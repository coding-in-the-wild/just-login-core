just-login-core
===============

This module handles the authentication at the database level for other just login modules.

##Getting Started

Install with [npm](http://nodejs.org):

	npm install just-login-core

Require:
```js
var Core = require('just-login-core')
```

##Core(db[, options])

- `db` is expecting a levelup database.
- `options` is an object that holds the (**gasp**) options!
	- `tokenGenerator` is expecting a function that returns an unique string each time it is called. This is used for token generation. Defaults to a UUID generator.
	- `tokenTtl` is a number in milliseconds of a token's Time To Live (TTL). Defaults to 5 minutes.
	- `tokenTtlCheckIntervalMs` is a number in milliseconds of the ttl's check interval. (See [tiny-level-ttl](https://github.com/ArtskydJ/tiny-level-ttl#ttldb-opts), `checkInterval` for more details.) Defaults to 10 seconds`.
	- `sessionUnauthenticatedAfterMsInactivity` is a number in milliseconds of a session's period of inactivity before they are unauthenticated. If the user does not call `isAuthenticated()` within that time period, thy will be unauthenticated. (Logged out.) Defaults to 1 week.
	- `sessionTimeoutCheckIntervalMs` is a number in milliseconds of the session's timeout's check interval. (See [expire-unused-keys -> checkIntervalMs](https://github.com/tehshrike/expire-unused-keys#timeoutms-db-checkintervalms).) Defaults to 10 seconds.

`Core()` constructs an object that is an event emitter, (see [Events](#events)) and has the following methods:

- [`core.isAuthenticated(sessionId, cb)`](#coreisauthenticatedsessionid-cb)
- [`core.beginAuthentication(sessionId, contactAddress, cb)`](#corebeginauthenticationsessionid-contactaddress-cb)
- [`core.authenticate(token, cb)`](#coreauthenticatetoken-cb)
- [`core.unauthenticate(sessionId, cb)`](#coreunauthenticatesessionid-cb)

Example:

```js
var Core = require('just-login-core')
var Level = require('level-mem')
var db = Level('uniqueDatabaseNameHere')
var core = Core(db)
```

##core.isAuthenticated(sessionId, cb)

Checks if a user is authenticated. (Logged in.)

- `sessionId` is a string of the session id in question.
- `cb` is a function with the following arguments:
	- `err` is null if there was no error, and is an Error object if there was an error.
	- `contactAddress` is null is the user is not authenticated, and is a string of their contact address if they are authenticated.

Example:

```js
core.isAuthenticated("whatever the session id is", function(err, contactAddress) {
	if (!err) {
		console.log(contactAddress)
		//if not logged in, logs "null"
		//if logged in, logs: "fake@example.com"
	}
})
```

##core.beginAuthentication(sessionId, contactAddress, cb)

Starts the authentication process by emitting the 'authentication initiated' event with a token and the contact address.

Something else must listen for the event, and send a message to the user. See [Events](#events) for more information.

- `sessionId` is a string of the session id that is trying to get authenticated.
- `contactAddress` is string of the user's contact info, (usually an email address).
- `cb` is a function with the following arguments:
	- `err` is null if there is no error, and is an Error object is there was an error.
	- `authReqInfo` is an object with the authentication request information. The object is identical to the object emitted in the event, with the following properties:
		- `token` is a string of the token.
		- `contactAddress` is a string with the contact address.

Example:

```js
core.beginAuthentication("whatever the session id is", "fake@example.com", function (err, authReqInfo) {
	if (!err) {
		console.log(authReqInfo.token) //logs the token
		console.log(authReqInfo.contactAddress) //logs: "fake@example.com"
	}
})
```

##core.authenticate(token, cb)

Sets the appropriate session id to be authenticated with the contact address associated with that token.

- `token` is a string of the token that is trying to get authenticated.
- `cb` is a function with the following arguments: (Same as [`core.isAuthenticated()`](#coreisauthenticatedsessionid-cb).)
	- `err` is null if there was no error, and is an Error object if there was an error.
	- `contactAddress` is null is the user is not authenticated, and is a string of their contact address if they are authenticated.

Example:

```js
core.authenticate("the token from the email", function(err, contactAddress) {
	if (!err && contactAddress) {
		console.log(contactAddress + 'is now logged in! Congratulations!')
	} else {
		console.log('Sorry, for some reason you are not logged in.')
	}
})
```

##core.unauthenticate(sessionId, cb)

Sets the appropriate session id to be unauthenticated.

- `token` is a string of the token that is trying to get authenticated.
- `cb` is a function with the following argument:
	- `err` is null if there was no error, and is an Error object if there was an error.

Example:

```js
core.unauthenticate("thisIsAValidToken", function(err) {
	if (err) {
		console.log("error:", err.message) //this is expected for invalid tokens (not previously logged in)
	} else {
		console.log("you have been logged out") //this is expected for valid tokens (previously logged in)
	}
})
```

##Events

`"authentication initiated"` is emitted when beginAuthentication is called. (Which should be when the user clicks the "login" button.)

```js
core.on('authentication initiated', function (object) {
	console.log(object.token)
	console.log(object.contactAddress)
})
```

(Suggestion: use the [Just-Login-Emailer](https://github.com/coding-in-the-wild/just-login-emailer) to catch this event.)
