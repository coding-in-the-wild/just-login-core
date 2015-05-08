var test = require('tape')
var JustLoginCore = require('../index.js')
var Levelup = require('level-mem')
var lock = require('level-lock')

var jlcOpts = {
	tokenGenerator: function () {
		return 'token'
	}
}

test('beginAuthentication respects level-lock locks', function(t) {
	var db = Levelup('newThang')
	var jlc = JustLoginCore(db, jlcOpts)

	jlc.beginAuthentication('key-1', 'value', function (err) {
		t.notOk(err, 'no err ' + (err && err.message))
		var unlock = lock(db, 'token', 'rw')
		t.equal(typeof unlock, 'function', 'unlock is a function')
		jlc.beginAuthentication('key-2', 'value', function (err) {
			t.ok(err, 'an error happened when locked ' + (err && err.message))
			unlock && unlock()
			jlc.beginAuthentication('key-3', 'value', function (err) {
				t.notOk(err, 'no error after lock given up ' + (err && err.message))
				t.end()
			})
		})
	})

})

test('authenticate respects level-lock locks', function(t) {
	var db = Levelup('newThang')
	var jlc = JustLoginCore(db, jlcOpts)

	db.put('token1', '{ "contactAddress": "wayToContactPerson", "sessionId": "it doesn\'t care" }')
	db.put('token2', '{ "contactAddress": "wayToContactPerson", "sessionId": "it doesn\'t care" }')

	jlc.authenticate('token1', function (err) {
		t.notOk(err, 'first auth has no err' + (err && err.message))
		var unlock = lock(db, 'token2', 'rw')
		t.ok(unlock, 'lock aquired')
		jlc.authenticate('token2', function (err) {
			t.ok(err, 'an error happened when locked ' + (err && err.message))
			unlock && unlock()
			jlc.authenticate('token2', function (err) {
				t.notOk(err, 'no error after lock given up ' + (err && err.message))
				t.end()
			})
		})
	})
})
