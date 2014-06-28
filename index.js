var events = require('events')

module.exports = function JustLoginCore(db, tokenGen) {

	function UUID() { //'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
		return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
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
		var storeUnderToken = JSON.stringify({
			sessionId: sessionId,
			contactAddress: contactAddress
		})
		db.put(token, storeUnderToken, function() {
			process.nextTick(function() {
				emitter.emit('authentication initiated', {
					token: token,
					contactAddress: contactAddress
				})
			})
		})
		return emitter
	}
	
	//authenticate(secret token, cb) -> sets the appropriate session id to be authenticated with the contact address associated with that secret token.
	//Calls the callback with null or the contact address depending on whether or not the login was successful (same as isAuthenticated)
	function authenticate(token, cb) {
		db.get(token, function(err, val) { //val = { contact address, session id }
			if (err && !err.notFound) { //if error (not including the notFound error)
				cb(err)
			} else {
				if (typeof val=='string')
					val = JSON.parse(val)

				if (typeof val=='object' && val.sessionId && val.contactAddress) {
					db.put(val.sessionId, val.contactAddress, function(err2) {
						if (err2)
							cb(err2)
						else
							cb(null, val.contactAddress)
					})
				} else {
					var temp = new Error("invalid value returned from token")
					temp.invalidToken = true
					cb(temp)
				}
			}
		})
	}
	
	//unauthenticate(session id, token, cb) -> deletes the token key and then the sessionid key from the database
	function unauthenticate(sessionId, token, cb) {
		db.del(token, function(err) {
			if (!err)
				db.del(sessionId, cb)
			else if (cb)
				cb(err)
			else
				throw err
				
		})
	}

	return {
		isAuthenticated: isAuthenticated,
		beginAuthentication: beginAuthentication,
		authenticate: authenticate,
		unauthenticate: unauthenticate
	}
}

/*
Things to store
---------------
- session id -> contact address (if authenticated)
- token -> { contact address, session id }
*/
