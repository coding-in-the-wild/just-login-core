just-login-core
===============

- [Information](#information)
- [Install](#install)
- [Require and Construct](#require-and-construct)
- [Methods](#methods)
- [jlc.isAuthenticated(sessionId, cb)](#jlcisauthenticatedsessionid-cb)
- [jlc.beginAuthentication(sessionId, contactAddress)](#jlcbeginauthenticationsessionid-contactaddress)
- [jlc.authenticate(secretToken, cb)](#jlcauthenticatesecrettoken-cb)
- [jlc.unauthenticate(sessionId, secretToken, cb)](#jlcunauthenticatesessionid-secrettoken-cb)
- [Specs](#specs)

#Information

Handle sessions and secrets and user ids, oh my!

This module holds the core functionality of the just login module.

The constructor takes a levelup database.

##Install

Install with npm:

	npm install just-login-core
	
##Require and Construct
	var Jlc = require('just-login-core')
	var level = require('level-mem')
	var db = level('uniqueNameHere')
	var jlc = Jlc(db)

or

	var jlc = require('just-login-core')(require('level-mem')('uniqueNameHere'))

Please don't do the latter; it's ugly, hard to read, and ugly.


##Methods

###jlc.isAuthenticated(sessionId, cb)

Calls the callback with null or a contact address if authenticated

Example of an authenticated user (a user who was logged in previously)

	jlc.isAuthenticated("previouslyLoggedInSessionId", function(err, contactAddress) {
		if (!err)
			console.log(contactAddress) //logs: "fake@example.com"
	})

Example of an unauthenticated user (a user who was NOT logged in previously)

	jlc.isAuthenticated("notPreviouslyLoggedInSessionId", function(err, contactAddress) {
		if (!err)
			console.log(contactAddress) //logs: ""
	})

###jlc.beginAuthentication(sessionId, contactAddress)

Emits an event with a secret token and the contact address, so somebody can go send a message to that address.

	var emitAuth = jlc.beginAuthentication("wantToLogInSessionId", "fake@example.com")
	emitAuth.on('authentication initiated', function(authInit) {
		console.log(authInit.token)     //logs the secret token
		console.log(authInit.sessionId) //logs the session id
	})

(Suggestion: use the [Just-Login-Emailer](https://github.com/coding-in-the-wild/just-login-emailer) or my fork of the same [emailer](https://github.com/ArtskydJ/just-login-emailer) for this.)

###jlc.authenticate(secretToken, cb)

Sets the appropriate session id to be authenticated with the contact address associated with that secret token.

Calls the callback with null or the contact address depending on whether or not the login was successfull (same as isAuthenticated)

If the token is invalid:

	jlc.authenticate("tokenFromEmail", function(err, contactAddress) {
		if (!err)
			console.log(contactAddress) //logs: ""
	})

If the token is valid:

	jlc.authenticate("tokenFromEmail", function(err, contactAddress) {
		if (!err)
			console.log(contactAddress) //logs: "fake@example.com"
	})

###jlc.unauthenticate(sessionId, secretToken, cb)

Sets the appropriate session id to be unauthenticated.

Calls the callback with an error if one occurs. Note that if no callback is given, the error will be thrown.

If the token is valid:

	jlc.unauthenticate("thisIsAValidToken", function(err, contactAddress) {
		if (err)
			console.log("error")
		else
			console.log("you have been logged out") //this should happen
	})

If the token is invalid:

	jlc.unauthenticate("thisIsAnInvalidToken", function(err) {
		if (err && err.invalidToken)
			console.log("invalid token")
		else if (err)
			console.log("error:", err.message)
		else
			console.log("you have been logged out")
	})


##Specs

The constructor is passed a level up database.
It can also be passed a secret-code generating function, which must return a unique string; it will use the built in function if not supplied

If no code-generating function is supplied, use a UUID gen

Stores: (in a levelup database)

	session id: contact address (if authenticated)
	secret code: { contact address, session id }
