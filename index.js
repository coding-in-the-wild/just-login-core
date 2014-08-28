var EventEmitter = require('events').EventEmitter
var ttl = require('level-ttl')
var sublevel = require('level-sublevel')
var ms = require('ms')
var xtend = require('xtend')
var Expirer = require('expire-unused-keys')
var lock = require('level-lock')

var defaultOptions = {
	tokenGenerator: UUID,
	tokenTtl: ms('5 minutes'), //docs say 5 min
	tokenTtlCheckIntervalMs: ms('10 seconds'), //docs say 10 sec
	sessionUnauthenticatedAfterMsInactivity: ms('7 days'), //docs say 1 week
	sessionTimeoutCheckIntervalMs: ms('10 seconds') //docs say 10 sec
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
	var sessionExpirationDb = db.sublevel('expiration')
	var tokenDb = db.sublevel('token')
	tokenDb = ttl(tokenDb, {
		checkFrequency: options.tokenTtlCheckFrequencyMs
	})

	var emitter = new EventEmitter()
 	var expirer = new Expirer(
 		options.sessionUnauthenticatedAfterMsInactivity,
 		sessionExpirationDb,
 		options.sessionTimeoutCheckIntervalMs
 	)
 	expirer.on('expire', function (sessionId) {
 		unauthenticate(sessionId, function (err) {
 			if (err) {
 				process.nextTick(function () {
 					unauthenticate(sessionId, function () {}) //if error, try again
 				})
 			}
 		})
 	})

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
		var unlockSession = lock(sessionDb, sessionId, 'r')
		if (!unlockSession) {
			cb(new Error('Session read error'))
		} else {
			sessionDb.get(sessionId, dbSessionIdOpts, function (err, address) {
				unlockSession()
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
		
	}
	
	//beginAuthentication(session id, contact address, cb)
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
			var unlockToken = lock(tokenDb, token, 'w')
			if (!unlockToken) {
				cb(new Error('Token write error'))
			} else {
				tokenDb.put(token, storeUnderToken, dbTokenOpts, function (err) {
					unlockToken()
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
		
	}
	
	//authenticate(secret token, cb)
	//sets the appropriate session id to be authenticated with the contact address associated with that secret token.
	//Calls the callback with and error and either null or the contact address depending on whether or not the login was successful (same as isAuthenticated)
	function authenticate(token, cb) { //cb(err, credentials)
		var unlockToken = lock(tokenDb, token, 'r')
		if (!unlockToken) {
			cb(new Error('Token read error'))
		} else {
			tokenDb.get(token, dbTokenOpts, function (err, credentials) { //credentials = { contact address, session id }
				unlockToken()
				if (err && err.notFound) { //if did not find value
					cb(new Error('No token found'))
				} else if (err) { //if error (not including the notFound error)
					cb(err)
				} else { //found value
					var unlockSession = lock(sessionDb, credentials.sessionId, 'w')
					if (!unlockSession) {
						cb(new Error('Session write error'))
					} else {
						sessionDb.put(credentials.sessionId, credentials.contactAddress, dbSessionIdOpts, function (err2) {
							unlockSession()
							if (err2) {
								cb(err2)
							} else {
								expirer.touch(credentials.sessionId)
								var unlockToken = lock(tokenDb, token, 'w')
								if (!unlockToken) {
									cb(new Error('Token write error'))
								} else {
									tokenDb.del(token, dbTokenOpts, function (err) {
										unlockToken()
										if (err) {
											cb(err)
										} else {
											cb(null, credentials)
										}
									})
								}
							}
						})
					}
				}
			})
		}
	}
	
	//unauthenticate(session id, cb)
	//deletes the sessionid key from the database
	function unauthenticate(sessionId, cb) { //cb(err)
		expirer.forget(sessionId)
		var unlockSession = lock(sessionDb, sessionId, 'w')
		if (!unlockSession) {
			cb && cb(new Error('Session write error'))
		} else {
			sessionDb.del(sessionId, dbSessionIdOpts, function (err) {
				unlockSession()
				if (err) {
					cb && cb(err)
				} else {
					cb && cb(null)
				}
			})
		}
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
