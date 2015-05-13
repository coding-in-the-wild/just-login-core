var test = require('tape')
var JustLoginCore = require('../index.js')
var Levelup = require('level-mem')
var Mutexify = require('mutexify')

var lock = Mutexify()
lock.wat=true
var jlcOpts = {
	tokenLock: lock,
	tokenGenerator: function () {
		return 'token'
	}
}

test('beginAuthentication respects mutexify locks', function(t) {
	var db = new Levelup()
	var jlc = JustLoginCore(db, jlcOpts)

	jlc.beginAuthentication('key-1', 'value', function (err) {
		t.notOk(err, 'no err ' + (err && err.message))
		var before = new Date().getTime()
		lock(function (unlock) {
			setTimeout(unlock, 200)
		})
		jlc.beginAuthentication('key-2', 'value', function (err) {
			t.notOk(err, 'no error when locked')
			var elapsed = new Date().getTime() - before
			t.ok(elapsed >= 195, 'waited long enough: ' + elapsed)
			t.ok(elapsed <= 250, 'did not wait too long')
			t.end()
		})
	})

})

test('authenticate respects mutexify locks', function(t) {
	var db = new Levelup()
	var jlc = JustLoginCore(db, jlcOpts)

	db.put('token1', '{ "contactAddress": "wayToContactPerson", "sessionId": "it doesn\'t care" }')
	db.put('token2', '{ "contactAddress": "wayToContactPerson", "sessionId": "it doesn\'t care" }')

	jlc.authenticate('token1', function (err) {
		t.notOk(err, 'first auth has no err' + (err && err.message))
		var before = new Date().getTime()
		lock(function (unlock) {
			setTimeout(unlock, 200)
		})
		setTimeout(function () {
			jlc.authenticate('token2', function (err) {
				t.notOk(err, 'no error when locked')
				var elapsed = new Date().getTime() - before
				t.ok(elapsed >= 195, 'waited long enough: ' + elapsed)
				t.ok(elapsed <= 250, 'did not wait too long')
				t.end()
			})
		}, 5)
	})
})
