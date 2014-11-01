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

function makeResultAnObject(cb) {
	return function (err, result) {
		if (err) {
			cb(err)
		} else {
			try {
				cb(err, JSON.parse(result))
			} catch (e) {
				cb(e)
			}
		}
	}
}

function wrap(fn, cb) { //wrap any function to a callback, used here with level-lock's `unlock` functions
	return function () {
		if (typeof fn === 'function') {
			fn()
		} else if (Array.isArray(fn)) {
			fn.forEach(function (func) { func() })
		}
		cb.apply(null, arguments)
	}
}

function createNewSession(sessionDb, tokenDb, expirer, credentials, token, cb) {
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

function createToken(tokenGenerator, tokenDb, sessionId, contactAddress, cb) {
	var token = tokenGenerator()
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
			cb(null, token)
		}))
	}
}

module.exports = function JustLoginCore(sessionDb, sessionExpireDb, tokenDb, options) {
	var emitter = new EventEmitter()

	ttl(tokenDb, { //watch for 'put's
		ttl: options.tokenTtl,
		checkInterval: options.tokenTtlCheckIntervalMs
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
	
	//emits an event with a secret token and the contact address, so somebody can go send a message to that address
	function beginAuthentication(sessionId, contactAddress, cb) {
		if (typeof sessionId !== "string" || typeof contactAddress !== "string") {
			process.nextTick(function () {
				cb(new Error("Session id and/or contact address is not a string."))
			})
		} else {
			createToken(options.tokenGenerator, tokenDb, sessionId, contactAddress, cbIfErr(cb, function (err, token) {
				var credentials = {
					token: token,
					contactAddress: contactAddress
				}
				emitter.emit('authentication initiated', credentials)
				cb(null, credentials)
			}))
		}
	}
	
	//sets the appropriate session id to be authenticated with the contact
	//address associated with that secret token.
	//Calls the callback with and error and either null or the contact address
	//depending if the login was successful; same as isAuthenticated()
	function authenticate(token, cb) { //cb(err, credentials)
		if (!token) {
			cb(new Error('No token found'))
		} else {
			var unlockToken = lock(tokenDb, token, 'rw')
			if (!unlockToken) {
				cb(new Error('Token read/write error'))
			} else {
				cb = wrap(unlockToken, cb)
				function handleCredentials(err, credentials) { //credentials = { contact address, session id }
					if ((err && err.notFound) || !credentials) { //if did not find credentials
						cb(new Error('No valid token found'))
					} else { //found value
						createNewSession(sessionDb, tokenDb, expirer, credentials, token, cb)
					}
				}

				tokenDb.get(token, cbIfErr(cb, makeResultAnObject(handleCredentials)))
			}
		}
	}
	
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
