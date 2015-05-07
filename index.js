var spaces = require('level-spaces')
var xtend = require('xtend')
var core = require('./core.js')

var defaultOptions = {
	tokenGenerator: UUID,
	tokenTtl: 5 * 60 * 1000, //docs say 5 min
	tokenTtlCheckIntervalMs: 10 * 1000, //docs say 10 sec
	sessionUnauthenticatedAfterMsInactivity: 7 * 24 * 60 * 60 * 1000, //docs say 1 week
	sessionTimeoutCheckIntervalMs: 10 * 1000 //docs say 10 sec
}

function UUID() { //'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
	return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0
		var v = c == 'x' ? r : (r & 0x3 | 0x8)
		return v.toString(16)
	})
}

module.exports = function JustLoginCore(db, options) {
	if (!db) {
		throw new Error("Just Login Core requires a valid levelup database!")
	}

	var authedSessionsDb = spaces(db, 'session')
	var authedSessionsExpirationDb = spaces(db, 'session-expiration')
	var tokenDb = spaces(db, 'token', {valueEncoding: 'json'})
	options = xtend(defaultOptions, options)

	return core(authedSessionsDb, authedSessionsExpirationDb, tokenDb, options)
}
