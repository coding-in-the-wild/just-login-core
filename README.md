just-login-core
===============

This module handles the authentication at the database level for other just login modules.

- [Startup](#startup)
- [Jlc(db[, tokenGenerator])](#jlcdb-tokengenerator)
- [jlc.isAuthenticated(sessionId, cb)](#jlcisauthenticatedsessionid-cb)
- [jlc.beginAuthentication(sessionId, contactAddress)](#jlcbeginauthenticationsessionid-contactaddress)
- [jlc.authenticate(secretToken, cb)](#jlcauthenticatesecrettoken-cb)
- [jlc.unauthenticate(sessionId, cb)](#jlcunauthenticatesessionid-cb)
- [Events](#events)

##Startup

Install with npm:

	npm install just-login-core

Require:

	var Jlc = require('just-login-core')
	
##Jlc(db[, tokenGenerator])

- `db` is expecting a levelup database.
- `tokenGenerator` is expecting a function that returns an unique string each time it is called. This is used for token generation. Defaults to a UUID generator.

`Jlc()` constructs an object that is an event emitter, (see [Events](#events)) and has the following methods:

- [`jlc.isAuthenticated(sessionId, cb)`](#jlcisauthenticatedsessionid-cb)
- [`jlc.beginAuthentication(sessionId, contactAddress)`](#jlcbeginauthenticationsessionid-contactaddress)
- [`jlc.authenticate(secretToken, cb)`](#jlcauthenticatesecrettoken-cb)
- [`jlc.unauthenticate(sessionId, cb)`](#jlcunauthenticatesessionid-cb)

	var Jlc = require('just-login-core')
	var Level = require('level-mem')
	var db = Level('uniqueDatabaseNameHere')
	var jlc = Jlc(db)

##jlc.isAuthenticated(sessionId, cb)

Checks if a user is authenticated. (Logged in.)

- `sessionId` is a string of the session id in question.
- `cb` is a function with these arguments: `err`, `contactAddress`.
	- `err` is null if there was no error, and is an Error object if there was an error.
	- `contactAddress` is null is the user is not authenticated, and is a string of their contact address if they are authenticated.

Example of an authenticated user:

	jlc.isAuthenticated("previouslyLoggedInSessionId", function(err, contactAddress) {
		if (!err)
			console.log(contactAddress) //logs: "fake@example.com"
	})

Example of an unauthenticated user:

	jlc.isAuthenticated("notPreviouslyLoggedInSessionId", function(err, contactAddress) {
		if (!err)
			console.log(contactAddress) //logs: "null"
	})

##jlc.beginAuthentication(sessionId, contactAddress)

Starts the authentication process by emitting the 'authentication initiated' event with a secret token and the contact address.

Something else must listen for the event, and send a message to the user. See [Events](#events) for more information.

- `sessionId` is a string of the session id that is trying to get authenticated.
- `contactAddress` is string of the user's contact info, (usually an email address).

	jlc.beginAuthentication("wantToLogInSessionId", "fake@example.com")

##jlc.authenticate(secretToken, cb)

Sets the appropriate session id to be authenticated with the contact address associated with that secret token.

- `secretToken` is a string of the token that is trying to get authenticated.
- `cb` is a function with these arguments: `err`, `contactAddress`. (Same as [`jlc.isAuthenticated()`](#jlcisauthenticatedsessionid-cb).)
	- `err` is null if there was no error, and is an Error object if there was an error.
	- `contactAddress` is null is the user is not authenticated, and is a string of their contact address if they are authenticated.

If the token is invalid:

	jlc.authenticate("tokenFromEmail", function(err, contactAddress) {
		if (!err)
			console.log(contactAddress) //logs: "null"
	})

If the token is valid:

	jlc.authenticate("tokenFromEmail", function(err, contactAddress) {
		if (!err)
			console.log(contactAddress) //logs: "fake@example.com"
	})

##jlc.unauthenticate(sessionId, cb)

Sets the appropriate session id to be unauthenticated.

- `secretToken` is a string of the token that is trying to get authenticated.
- `cb` is a function with these arguments: `err`, `contactAddress`. (Same as [`jlc.isAuthenticated()`](#jlcisauthenticatedsessionid-cb).)
	- `err` is undefined if there was no error, and is an Error object if there was an error.

	jlc.unauthenticate("thisIsAValidToken", function(err) {
		if (err)
			console.log("error:", err.message) //this is expected for invalid tokens (not previously logged in)
		else
			console.log("you have been logged out") //this is expected for valid tokens (previously logged in)
	})

##Events

`"authentication initiated"` is emitted when beginAuthentication is called. (Which should be when the user clicks the "login" button.)

	jlc.on('authentication initiated', function (obj) {
		console.log(object.token)
		console.log(object.contactAddress)
	})

(Suggestion: use the official [Coding in the Wild/Just-Login-Emailer](https://github.com/coding-in-the-wild/just-login-emailer) or my (more updated?) fork of the [ArtskydJ/Just-Login-Emailer](https://github.com/ArtskydJ/just-login-emailer) for catching this event.)
