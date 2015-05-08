var EventEmitter = require('events').EventEmitter
var ttl = require('tiny-level-ttl')
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
			var result = null
			try {
				result = JSON.parse(result)
			} catch (e) {
				cb(e)
				return
			}
			cb(null, result)
		}
	}
}

//Wrap any function to a callback:
//Used here with level-lock's `unlock` functions.
//Basically, a function to monkey-patch with ease!
function wrap(fn, cb) {
	return function () {
		if (typeof fn === 'function') {
			fn()
		} else if (Array.isArray(fn)) {
			fn.forEach(function (func) { func() })
		}
		cb.apply(null, arguments)
	}
}

//This function is called synchronously, so `cb` must be called asynchronously.
function createToken(tokenGenerator, tokenDb, sessionId, contactAddress, cb) {
	var token = tokenGenerator()
	var storeUnderToken = {
		sessionId: sessionId,
		contactAddress: contactAddress
	}
	var unlockToken = lock(tokenDb, token, 'w')
	if (!unlockToken) {
		process.nextTick(function () {
			cb(new Error('Token write error'))
		})
	} else {
		cb = wrap(unlockToken, cb)
		tokenDb.put(token, storeUnderToken, cbIfErr(cb, function () {
			cb(null, token)
		}))
	}
}

module.exports = function JustLoginCore(tokenDb, options) {
	var emitter = new EventEmitter()

	ttl(tokenDb, {
		ttl: options.tokenTtl,
		checkInterval: options.tokenTtlCheckIntervalMs
	})

	//Emits an event with a secret token and the contact address
	//so somebody can go send a message to that address.
	function beginAuthentication(sessionId, contactAddress, cb) {
		if (typeof sessionId !== 'string' || typeof contactAddress !== 'string') {
			process.nextTick(function () {
				cb(new Error('Session id and/or contact address is not a string.'))
			})
		} else {
			createToken(options.tokenGenerator, tokenDb, sessionId, contactAddress, cbIfErr(cb, function (err, token) {
				var credentials = {
					token: token,
					contactAddress: contactAddress
				}
				emitter.emit('authentication initiated', credentials)
				cb && cb(null, credentials)
			}))
		}
	}

	//sets the appropriate session id to be authenticated with the contact
	//address associated with that secret token.
	//Calls the callback with and error and either null or the contact address
	//depending if the login was successful; same as isAuthenticated()
	function authenticate(token, cb) { //cb(err, credentials)
		if (!token) {
			process.nextTick(function () {
				cb(new Error('No token found'))
			})
		} else {
			var unlockToken = lock(tokenDb, token, 'rw')
			if (!unlockToken) {
				process.nextTick(function () {
					cb(new Error('Token read/write error'))
				})
			} else {
				cb = wrap(unlockToken, cb)

				tokenDb.get(token, cbIfErr(cb, makeResultAnObject(handleCredentials)))

				//credentials = { contact address, session id }
				function handleCredentials(err, credentials) {
					if (err && err.notFound) {
						cb(new Error('No valid token found'))
					} else {
						tokenDb.del(token, cbIfErr(cb, function () {
							emitter.emit('authenticated', credentials)
							cb(null, credentials)
						}))
					}
				}
			}
		}
	}

	emitter.beginAuthentication = beginAuthentication
	emitter.authenticate = authenticate

	return emitter
}

/*
Things to store
---------------
- session id -> contact address (if authenticated)
- token -> { contact address, session id }
*/
