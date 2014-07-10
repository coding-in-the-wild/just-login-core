var EventEmitter = require('events').EventEmitter
var dbSessionIdOpts = {
	keyEncoding: 'utf8',
	valueEncoding: 'utf8'
}
var dbTokenOpts = {
	keyEncoding: 'utf8',
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
	function isAuthenticated(sessionId, cb) { //cb(err, addr)
		db.get(sessionId, dbSessionIdOpts, function(err, val) {
			if (err && !err.notFound) { //if bad error
				err.get = true
				err.isAuth = true
				err.ioe = err instanceof Error
				cb(err)
			} else if (err && err.notFound) { //if notFound error
				cb(null, null)
			} else { //if no error
				cb(null, val)
			}
		})
	}
	
	//beginAuthentication(session id, contact address) -> emits an event with a secret token and the contact address, so somebody can go send a message to that address
	function beginAuthentication(sessionId, contactAddress) {
		var token = tokenGen()
		var storeUnderToken = {
			sessionId: sessionId,
			contactAddress: contactAddress
		}
		db.put(token, storeUnderToken, dbTokenOpts, function(err) {
			if (err) throw err
			process.nextTick(function() {
				emitter.emit('authentication initiated', {
					token: token,
					contactAddress: contactAddress
				})
			})
		})
	}
	
	//authenticate(secret token, cb) -> sets the appropriate session id to be authenticated with the contact address associated with that secret token.
	//Calls the callback with null or the contact address depending on whether or not the login was successful (same as isAuthenticated)
	function authenticate(token, cb) { //cb(err, addr)
		db.get(token, dbTokenOpts, function(err, val) { //val = { contact address, session id }
			if (err && !err.notFound) { //if error (not including the notFound error)
				err.get = true
				err.auth = true
				err.ioe = err instanceof Error
				cb(err)
			} else if ((err && err.notFound) || !val) {
				var temp = new Error("invalid value returned from token")
				temp.invalidToken = true
				temp.auth = true
				temp.ioe = err instanceof Error
				cb(temp)
			} else if (val && val.sessionId && val.contactAddress) {
				db.put(val.sessionId, val.contactAddress, dbSessionIdOpts, function(err2) {
					if (err2) {
						err2.put = true
						err2.auth = true
						err2.ioe = err instanceof Error
						cb(err2)
					} else {
						cb(null, val.contactAddress)
					}
				})
			}
		})
	}
	
	//unauthenticate(session id, cb) -> deletes the token key and then the sessionid key from the database
	function unauthenticate(sessionId, cb) {
		db.del(sessionId, dbSessionIdOpts, cb)
	}

	emitter.isAuthenticated = isAuthenticated
	emitter.beginAuthentication = beginAuthentication
	emitter.authenticate = authenticate
	emitter.unauthenticate = unauthenticate

	return emitter
}

/*
Things to store
---------------
- session id -> contact address (if authenticated)
- token -> { contact address, session id }
*/
