var lock = require('level-lock')

function jsonParse(value, cb) {
	var err = null, result
	try {
		result = JSON.parse(value)
	} catch (e) {
		err = e
	}
	cb(err, result)
}

module.exports = function a(emitter, tokenDb) {
	return function authenticate(token, cb) { //cb(err, credentials)
		if (!cb) cb = function () {}

		if (!token) {
			setTimeout(cb, 0, new Error('No token found'))
		} else {
			var unlockToken = lock(tokenDb, token, 'rw')
			if (!unlockToken) {
				setTimeout(cb, 0, new Error('Token read/write error'))
			} else {
				function cb2() {
					unlockToken()
					cb.apply(null, arguments)
				}
				tokenDb.get(token, function (err, value) {
					if (err && err.notFound) {
						cb2(new Error('No valid token found'))
					} else if (err) {
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
			}
		}
	}
}
