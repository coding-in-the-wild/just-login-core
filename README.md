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

- isAuthenticated(session id, cb) -> calls the callback with null or a contact address if authenticated
- beginAuthentication(session id, contact address) -> emits an event with a secret token and the contact address, so somebody can go send a message to that address
- authenticate(secret token, cb) -> sets the appropriate session id to be authenticated with the contact address associated with that secret token.  Calls the callback with null or the contact address depending on whether or not the login was successfull (same as isAuthenticated)

Things to store
---------------

- session id -> contact address (if authenticated)
- secret code -> { contact address, session id }
