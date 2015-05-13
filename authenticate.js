function jsonParse(value, cb) {
	var err = null, result
	try {
		result = JSON.parse(value)
	} catch (e) {
		err = e
	}
	cb(err, result)
}

module.exports = function a(emitter, tokenDb, tokenLock) {
	return function authenticate(token, cb) { //cb(err, credentials)
		if (!cb) cb = function () {}

		if (!token) {
			process.nextTick(function () {
				cb(new Error('No token found'))
			})
		} else {
			tokenLock(function (unlock) {
				function cb2() {
					unlock()
					cb.apply(null, arguments)
				}
				tokenDb.get(token, function (err, value) {
					if (err) {
						cb2(err)
					} else {
						jsonParse(value, function (err, credentials) {
							tokenDb.del(token, function (err) {
								if (err) {
									cb2(err)
								} else {
									emitter.emit('authenticated', credentials)
									cb2(null, credentials)
								}
							})
						})
					}
				})
			})
		}
	}
}
