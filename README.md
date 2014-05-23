just-login-core
===============

Handle sessions and secrets and user ids, oh my!

Specs or whatever
=================

is passed a secret-code generating function, which must return a unique string.  Is also passed a LevelUP database to be used for storage.

If no code-generating function is supplied, use this as a default:

    function UUID() {
    	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
    		return v.toString(16)
    	})
    }

exposes
-------

- isAuthenticated(session id, cb) -> read the session id from the database, and call the callback with null or a contact address

- beginAuthentication(session id, contact address) -> emits an event with a secret token and the contact address, so somebody can go send a message to that address. Creates secret code, gets session id and contact info, emits event, writes secret code, always writes to database.

- authenticate(secret token, cb(session, contact)) -> sets the appropriate session id to be authenticated with the contact address associated with that secret token.  If session id is valid (is login was successful): Call the callback with the contact address. Also write the session id to the database. If invalid (unsuccessful login): Call the callback with null (same as isAuthenticated)

- unAuthenticate(session) -> delete session from database

notes
-----

- levelup is created in the tests, and levelmem is passed to it

- levelmem is created in the module

- check out levelup-cache by tehshrike, view tests


Things to store
---------------

- session id -> contact address (if authenticated)
- secret code -> { contact address, session id }

Usage notes
===========

This library doesn't expire anything in its levelup stores.  You'll have to wrap it up in something like level-ttl.
