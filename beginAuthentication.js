module.exports = function b(emitter, tokenDb, tokenLock, tokenGenerator) {
	return function beginAuthentication(sessionId, contactAddress, cb) {
		if (!cb) cb = function () {}

		if (typeof sessionId !== 'string' || typeof contactAddress !== 'string') {
			setTimeout(cb, 0, new Error('Session id and/or contact address is not a string.'))
		} else {
			var token = tokenGenerator()
			var user = JSON.stringify({
				sessionId: sessionId,
				contactAddress: contactAddress
			})

			tokenLock(token)(function (unlock) {
				tokenDb.put(token, user, function (err) {
					unlock()
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
			})
		}
	}
}
