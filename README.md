just-login-core
===============

- [Information](https://github.com/ArtskydJ/just-login-core#information)
- [Install](https://github.com/ArtskydJ/just-login-core#install)
- [Require and Construct](https://github.com/ArtskydJ/just-login-core#require-and-construct)
- [Methods](https://github.com/ArtskydJ/just-login-core#methods)
- [jlc.isAuthenticated(sessionId, cb)](https://github.com/ArtskydJ/just-login-core#jlc-isauthenticated-sessionid-cb)
- [jlc.beginAuthentication(sessionId, contactAddress)](https://github.com/ArtskydJ/just-login-core#jlc-isauthenticated-sessionid-contactaddress)
- [jlc.authenticate(sessionId, cb)](https://github.com/ArtskydJ/just-login-core#jlc-isauthenticated-sessionid-cb)
- [Specs](https://github.com/ArtskydJ/just-login-core#specs)

#Information

Handle sessions and secrets and user ids, oh my!

This module holds the core functionality of the just login module.

The JlCore constructor takes a levelup database.

##Install
	npm install just-login-core
	
##Require and Construct
	var Jlc = require('just-login-core')
	var level = require('level-mem')
	var db = level('uniqueNameHere')
	var jlc = Jlc(db)

or

	var jlc = require('just-login-core')(require('level-mem')('uniqueNameHere'))

Please don't do the latter, it's ugly, hard to read, and ugly.


##Methods

###jlc.isAuthenticated(session id, cb)

calls the callback with null or a contact address if authenticated

###jlc.beginAuthentication(session id, contact address)

Emits an event with a secret token and the contact address, so somebody can go send a message to that address

(Suggestion: use the [Just-Login-Emailer](https://github.com/coding-in-the-wild/just-login-emailer) or my fork of the same [emailer](https://github.com/ArtskydJ/just-login-emailer) for this.)

###jlc.authenticate(secret token, cb)

Sets the appropriate session id to be authenticated with the contact address associated with that secret token.

Calls the callback with null or the contact address depending on whether or not the login was successfull (same as isAuthenticated)


##Specs

The constructor is passed a level up database.
It can also be passed a secret-code generating function, which must return a unique string; it will use the built in function if not supplied

If no code-generating function is supplied, use a UUID gen

Stores: (in a levelup database)

- session id -> contact address (if authenticated)
- secret code -> { contact address, session id }
