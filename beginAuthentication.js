var lock = require('level-lock')

module.exports = function b(emitter, tokenDb, tokenGenerator) {
	//Emits an event with a secret token and the contact address
	//so somebody can go send a message to that address.
	return function beginAuthentication(sessionId, contactAddress, cb) {
		if (typeof sessionId !== 'string' || typeof contactAddress !== 'string') {
			setTimeout(cb, 0, new Error('Session id and/or contact address is not a string.'))
		} else {
			var token = tokenGenerator()
			var user = JSON.stringify({
				sessionId: sessionId,
				contactAddress: contactAddress
			})

			var unlockToken = lock(tokenDb, token, 'w')
			if (!unlockToken) {
				setTimeout(cb, 0, new Error('Token write error'))
			} else {
				tokenDb.put(token, user, function (err) {
					unlockToken()
					if (err) {
						cb(err)
					} else {
						var info = {
							token: token,
							contactAddress: contactAddress
						}
						emitter.emit('authentication initiated', info)
						cb(null, info)
					}
				})
			}
		}
	}
}
