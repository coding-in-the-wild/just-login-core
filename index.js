var EventEmitter = require('events').EventEmitter

var levelupOptions = {
	valueEncoding: 'json'
}

module.exports = function JustLoginCore(db, tokenGen) {

	function UUID() { //'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
		return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random() * 16 | 0
			var v = c == 'x' ? r : (r & 0x3 | 0x8)
			return v.toString(16)
		})
    }

    var emitter = Object.create(new EventEmitter())

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
		var token = tokenGen()
		var loginRequest = {
			sessionId: sessionId,
			contactAddress: contactAddress
		}
		db.put(token, loginRequest, levelupOptions, function() {
			emitter.emit('authentication initiated', {
				token: token,
				contactAddress: contactAddress
			})
		})
	}

	//authenticate(secret token, cb) -> sets the appropriate session id to be authenticated with the contact address associated with that secret token.
	//Calls the callback with null or the contact address depending on whether or not the login was successful (same as isAuthenticated)
	function attemptAuthentication(token, cb) {
		db.get(token, levelupOptions, function(err, loginRequest) {
			if (err && err.notFound) {
				cb(null, false)
			} else if (err) {
				cb(err)
			} else {
				db.put(loginRequest.sessionId, loginRequest.contactAddress, function(err) {
					if (err) {
						cb(err)
					} else {
						cb(null, loginRequest.contactAddress)
					}
				})
			}
		})
	}

	emitter.isAuthenticated = isAuthenticated
	emitter.beginAuthentication = beginAuthentication
	emitter.authenticate = attemptAuthentication

	return emitter
}

/*
Things to store
---------------

- session id -> contact address (if authenticated)
- secret code -> { contact address, session id }
*/
