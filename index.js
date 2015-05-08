var xtend = require('xtend')
var uuid = require('random-uuid-v4')
var core = require('./core.js')

var defaultOptions = {
	tokenGenerator: uuid,
	tokenTtl: 5 * 60 * 1000, // 5 min
	tokenTtlCheckIntervalMs: 10 * 1000 // 10 sec
}

module.exports = function JustLoginCore(tokenDb, options) {
	if (!tokenDb) {
		throw new Error("Just Login Core requires a valid levelup database!")
	}

	return core(tokenDb, xtend(defaultOptions, options))
}
