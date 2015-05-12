var test = require('tape')
var JustLoginCore = require('../index.js')
var Levelup = require('level-mem')
var Locker = require('read-write-lock')

var lock = Locker()
var jlcOpts = {
	tokenLocker: lock,
	tokenGenerator: function () {
		return 'token'
	}
}

test('beginAuthentication respects read-write-lock locks', function(t) {
	var db = new Levelup()
	var jlc = JustLoginCore(db, jlcOpts)

	jlc.beginAuthentication('key-1', 'value', function (err) {
		t.notOk(err, 'no err ' + (err && err.message))
		lock.writeLock(function (unlock) {
			var before = new Date().getTime()
			jlc.beginAuthentication('key-2', 'value', function (err) {
				t.notOk(err, 'no error when locked')
				var elapsed = new Date().getTime() - before
				t.ok(elapsed >= 200, 'waited long enough')
				t.ok(elapsed <= 250, 'did not wait too long')
				t.end()
			})
			setTimeout(unlock, 200)
		})
	})

})

test('authenticate respects read-write-lock locks', function(t) {
	var db = new Levelup()
	var jlc = JustLoginCore(db, jlcOpts)

	db.put('token1', '{ "contactAddress": "wayToContactPerson", "sessionId": "it doesn\'t care" }')
	db.put('token2', '{ "contactAddress": "wayToContactPerson", "sessionId": "it doesn\'t care" }')

	jlc.authenticate('token1', function (err) {
		t.notOk(err, 'first auth has no err' + (err && err.message))
		lock.writeLock(function (unlock) {
			var before = new Date().getTime()
			jlc.authenticate('token2', function (err) {
				t.notOk(err, 'no error when locked')
				var elapsed = new Date().getTime() - before
				t.ok(elapsed >= 200, 'waited long enough')
				t.ok(elapsed <= 250, 'did not wait too long')
				t.end()
			})
			setTimeout(unlock, 200)
		})
	})
})
