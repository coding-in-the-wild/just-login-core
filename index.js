var EventEmitter = require('events').EventEmitter
var ttl = require('level-ttl')
var sublevel = require('level-sublevel')
var ms = require('ms')
var xtend = require('xtend')
var Expirer = require('expire-unused-keys')
var defaultOptions = {
	tokenGenerator: UUID,
	tokenTtl: ms('5 minutes'), //docs say 5 min
	sessionUnauthenticatedAfterMsInactivity: ms('7 days') //docs say 1 week
}

function UUID() { //'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
	return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0
		var v = c == 'x' ? r : (r & 0x3 | 0x8)
		return v.toString(16)
	})
}

module.exports = function JustLoginCore(db, options) {
	options = xtend(defaultOptions, options)

	if (!db) {
		throw new Error("Just Login Core requires a valid levelup database!")
	}
	db = sublevel(db)
	var sessionDb = db.sublevel('session')
	var tokenDb = db.sublevel('token')
	tokenDb = ttl(tokenDb)

	var emitter = new EventEmitter()
 	var expirer = new Expirer(options.sessionUnauthenticatedAfterMsInactivity, db)

	var dbSessionIdOpts = {
		keyEncoding: 'utf8',
		valueEncoding: 'utf8'
	}
	var dbTokenOpts = {
		keyEncoding: 'utf8',
		valueEncoding: 'json',
		ttl: options.tokenTtl
	}
	
	// to implement the 'clicky clicky logout', we will need the token emitter to emit the session id also.
	
	//isAuthenticated(session id, cb)
	//calls the callback with an error if applicable and either null or a contact address if authenticated
	function isAuthenticated(sessionId, cb) { //cb(err, addr)
		sessionDb.get(sessionId, dbSessionIdOpts, function(err, address) {
			if (err && !err.notFound) { //if bad error
				cb(err)
			} else if (err && err.notFound) { //if notFound error
				cb(null, null)
			} else { //if no error
				expirer.touch(sessionId)
				cb(null, address)
			}
		})
	}
	
	//beginAuthentication(session id, contact address)
	//emits an event with a secret token and the contact address, so somebody can go send a message to that address
	function beginAuthentication(sessionId, contactAddress, cb) {
		if (typeof sessionId !== "string" || typeof contactAddress !== "string") {
			process.nextTick(function () {
				cb(new Error("Session id or contact address is not a string."))
			})
		} else {
			var token = options.tokenGenerator()
			var storeUnderToken = {
				sessionId: sessionId,
				contactAddress: contactAddress
			}
			tokenDb.put(token, storeUnderToken, dbTokenOpts, function (err) {
				if (err) {
					cb(err)
				} else {
					var credentials = {
						token: token,
						contactAddress: contactAddress
					}
					emitter.emit('authentication initiated', credentials)
					cb(null, credentials)
				}
			})
		}
		
	}
	
	//authenticate(secret token, cb)
	//sets the appropriate session id to be authenticated with the contact address associated with that secret token.
	//Calls the callback with and error and either null or the contact address depending on whether or not the login was successful (same as isAuthenticated)
	function authenticate(token, cb) { //cb(err, addr)
		tokenDb.get(token, dbTokenOpts, function (err, credentials) { //credentials = { contact address, session id }
			if (err && err.notFound) { //if did not find value
				cb(new Error('No token found'))
			} else if (err) { //if error (not including the notFound error)
				cb(err)
			} else { //found value
				sessionDb.put(credentials.sessionId, credentials.contactAddress, dbSessionIdOpts, function (err2) {
					if (err2) {
						cb(err2)
					} else {
						expirer.touch(credentials.sessionId)
						tokenDb.del(token, dbTokenOpts, function (err) {
							if (err) {
								cb(err)
							} else {
								cb(null, credentials)
							}
						})
					}
				})
			}
		})
	}
	
	//unauthenticate(session id, cb)
	//deletes the sessionid key from the database
	function unauthenticate(sessionId, cb) {
		expirer.forget(sessionId)
		sessionDb.del(sessionId, dbSessionIdOpts, cb)
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
