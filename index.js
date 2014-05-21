var events = require('events')

module.exports = function JustLoginCore(db, tokenGen) {

	function UUID() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random() * 16 | 0
			var v = c == 'x' ? r : (r & 0x3 | 0x8)
			return v.toString(16)
		})
    }
	
	tokenGen = tokenGen || UUID
	
	//isAuthenticated(session id, cb) -> calls the callback with null or a contact address if authenticated
	function isAuthenticated(sessionId, cb) {
		db.get(sessionId, function(err, val) {
			if (err && !err.notFound) { //if non-notFound error
				cb(err)
			} else {
				cb(null, val)
			}
		})
	}
	
	//beginAuthentication(session id, contact address) -> emits an event with a secret token and the contact address, so somebody can go send a message to that address
	function beginAuthentication(sessionId, contactAddress) {
		var emitter = new events.EventEmitter()
		var token = tokenGen()
		var storeUnderToken = {
			sessionId: sessionId,
			contactAddress: contactAddress
		}
		db.put(token, storeUnderToken, function() {
			setTimeout(function() {
				emitter.emit('auth', {
					token: token,
					contactAddress: contactAddress
				})
			}, 10)
		})
		return emitter
	}
	
	//authenticate(secret token, cb) -> sets the appropriate session id to be authenticated with the contact address associated with that secret token.
	//Calls the callback with null or the contact address depending on whether or not the login was successful (same as isAuthenticated)
	function authenticate(token, cb) {
		db.get(token, function(err, val) {
			if (err && !err.notFound) { //if non-notFound error
				cb(err)
			} else {
				console.log('index.js, ln52, authenticate(), ',val)
				cb(null, val)
			}
		})
	}
	
	return {
		isAuthenticated: isAuthenticated,
		beginAuthentication: beginAuthentication,
		authenticate: authenticate
	}
}

/*
Things to store
---------------

- session id -> contact address (if authenticated)
- secret code -> { contact address, session id }
*/
