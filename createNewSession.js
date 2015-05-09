var lock = require('level-lock')

module.exports = function c(authedSessionsDb, expirer) {
	return function createNewSession(creds) {
		var unlockSession = lock(authedSessionsDb, creds.sessionId, 'w')
		if (!unlockSession) {
			cb(new Error('Session write error'))
		} else {
			authedSessionsDb.put(creds.sessionId, creds.contactAddress, function (err) {
				if (err) {
					unlockSession()
					cb(err)
				} else {
					unlockSession()
					expirer.touch(creds.sessionId)
					cb(null, creds)
				}
			})
		}
	}
}
