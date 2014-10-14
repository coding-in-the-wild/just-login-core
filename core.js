var EventEmitter = require('events').EventEmitter
var ttl = require('tiny-level-ttl')
var Expirer = require('expire-unused-keys')
var lock = require('level-lock')

function cbIfErr(onErr, noErr) {
	return function (err) {
		if (err && !err.notFound) onErr(err)
		else noErr.apply(null, [].slice.call(arguments)) //the error is applied
	}
}

function wrap(unlock, cb) { //wrap any function to a callback, used here with level-lock's `unlock` functions
	return function () {
		if (typeof unlock === 'function') {
			unlock()
		} else if (typeof unlock === 'object' && Array.isArray(unlock)) {
			unlock.forEach(function (fn) { fn() }) //Function.call
		}
		cb.apply(null, arguments)
	}
}

module.exports = function JustLoginCore(sessionDb, sessionExpireDb, tokenDb, tokenExpireDb, options) {
	var emitter = new EventEmitter()

	ttl(tokenDb, { //watch for 'put's
		ttl: options.tokenTtl,
		checkInterval: options.tokenTtlCheckIntervalMs,
		db: tokenExpireDb //store time records here
	})
	var expirer = new Expirer(
		options.sessionUnauthenticatedAfterMsInactivity,
		sessionExpireDb, //store time records here
		options.sessionTimeoutCheckIntervalMs
	)
	expirer.on('expire', function (sessionId) {
		unauthenticate(sessionId, function (err) {
			if (err) setTimeout(unauthenticate.bind(null, sessionId), 100) //if error, try again
		})
	})
	
	// to implement the 'clicky clicky logout', we will need the token emitter to emit the session id also.
	
	//isAuthenticated(session id, cb)
	//calls the callback with an error if applicable and either null or a contact address if authenticated
	function isAuthenticated(sessionId, cb) { //cb(err, addr)
		var unlockSession = lock(sessionDb, sessionId, 'r')
		if (!unlockSession) {
			cb(new Error('Session read error'))
		} else {
			cb = wrap(unlockSession, cb)
			sessionDb.get(sessionId, cbIfErr(cb, function (err, address) {
				if (err && err.notFound) { //if notFound error
					cb(null, null)
				} else { //if no error
					expirer.touch(sessionId)
					cb(null, address)
				}
			}))
		}
	}
	
	//beginAuthentication(session id, contact address, cb)
	//emits an event with a secret token and the contact address, so somebody can go send a message to that address
	function beginAuthentication(sessionId, contactAddress, cb) {
		if (typeof sessionId !== "string" || typeof contactAddress !== "string") {
			process.nextTick(function () {
				cb(new Error("Session id and/or contact address is not a string."))
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
				cb = wrap(unlockToken, cb)
				tokenDb.put(token, storeUnderToken, cbIfErr(cb, function () {
					var credentials = {
						token: token,
						contactAddress: contactAddress
					}
					emitter.emit('authentication initiated', credentials)
					cb(null, credentials)
				}))
			}
		}
	}
	
	//authenticate(secret token, cb)
	//sets the appropriate session id to be authenticated with the contact
	//address associated with that secret token.
	//Calls the callback with and error and either null or the contact address
	//depending if the login was successful; same as isAuthenticated()
	function authenticate(token, cb) { //cb(err, credentials)
		var unlockToken = lock(tokenDb, token, 'rw')
		if (!unlockToken) {
			cb(new Error('Token read/write error'))
		} else {
			cb = wrap(unlockToken, cb)

			tokenDb.get(token, {valueEncoding: 'json'}, cbIfErr(cb, function (err, credentials) { //credentials = { contact address, session id }
				if (err && err.notFound || !credentials) { //if did not find credentials
					cb(new Error('No valid token found'))
				} else { //found value
					if (typeof credentials === "string") { //level-spaces' limitations require this
						try {
							credentials = JSON.parse(credentials)
						} catch (err) {
							cb(err)
						}
					}
					var unlockSession = lock(sessionDb, credentials.sessionId, 'w') //must create the lock after the token's get
					if (!unlockSession) {
						cb(new Error('Session write error'))
					} else {
						cb = wrap(unlockSession, cb)
						sessionDb.put(credentials.sessionId, credentials.contactAddress, cbIfErr(cb, function () {
							expirer.touch(credentials.sessionId)
							tokenDb.del(token, cbIfErr(cb, function () {
								cb(null, credentials)
							}))
						}))
					}
				}
			}))
		}
	}
	
	//unauthenticate(session id, cb)
	//deletes the sessionid key from the database
	function unauthenticate(sessionId, cb) { //cb(err)
		cb = cb || function () {}
		expirer.forget(sessionId)
		var unlockSession = lock(sessionDb, sessionId, 'w')
		if (!unlockSession) {
			cb(new Error('Session write error'))
		} else {
			sessionDb.del(sessionId, function (err) {
				unlockSession()
				cb(err? err : null)
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
