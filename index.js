var spaces = require('level-spaces')
var ms = require('ms')
var xtend = require('xtend')
var core = require('./core.js')

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
	if (!db) {
		throw new Error("Just Login Core requires a valid levelup database!")
	}

	var sessionDb = spaces(db, 'session')
	var sessionExpirationDb = spaces(db, 'session-expiration')
	var tokenDb = spaces(db, 'token', {valueEncoding: 'json'})
	options = xtend(defaultOptions, options)

	return core(sessionDb, sessionExpirationDb, tokenDb, options)
}
