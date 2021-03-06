var EventEmitter = require('events').EventEmitter
var Mutexify = require('mutexify')
var keyMaster = require('key-master')
var uuid = require('random-uuid-v4')
var ttl = require('tiny-level-ttl')
var xtend = require('xtend')
var authenticate = require('./authenticate.js')
var begin = require('./beginAuthentication.js')

module.exports = function JustLoginCore(tokenDb, options) {
	if (!tokenDb) {
		throw new Error("Just Login Core requires a valid levelup database!")
	}
	var lock = keyMaster(Mutexify).get
	var opts = xtend({
		tokenGenerator: uuid,
		tokenTtl: 5 * 60 * 1000, // 5 min
		tokenTtlCheckIntervalMs: 10 * 1000 // 10 sec
	}, options)

	ttl(tokenDb, {
		ttl: opts.tokenTtl,
		checkInterval: opts.tokenTtlCheckIntervalMs
	})

	var emitter = new EventEmitter()

	emitter.authenticate = authenticate(emitter, tokenDb, lock)
	emitter.beginAuthentication = begin(emitter, tokenDb, lock, opts.tokenGenerator)
	emitter._lock = lock // tests use this

	return emitter
}
