var test = require('tape')
var JustLoginCore = require('../index.js')
var Levelup = require('level-mem')
var jlcOpts = {
	tokenGenerator: function () {
		return 'token2'
	}
}

test('beginAuthentication respects mutexify locks', function(t) {
	var db = new Levelup()
	var jlc = JustLoginCore(db, jlcOpts)
	var lock = jlc._lock

	jlc.beginAuthentication('token1', 'value', function (err) {
		t.notOk(err, 'no err ' + (err && err.message))
		var before = new Date().getTime()
		jlc._lock('token2')(function (unlock) {
			setTimeout(unlock, 200)
		})
		jlc.beginAuthentication('token2', 'value', function (err) {
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

	db.put('token1', '{ "contactAddress": "wayToContactPerson", "sessionId": "it doesn\'t care" }', function (err) {
		t.notOk(err, err && err.message)
		db.put('token2', '{ "contactAddress": "wayToContactPerson", "sessionId": "it doesn\'t care" }', function (err) {
			t.notOk(err, err && err.message)

			jlc.authenticate('token1', function (err) {
				t.notOk(err, 'first auth has no err' + (err && err.message))
				var before = new Date().getTime()
				jlc._lock('token2')(function (unlock) {
					setTimeout(unlock, 200)
				})
				jlc.authenticate('token2', function (err) {
					t.notOk(err, 'no error when locked')
					var elapsed = new Date().getTime() - before
					t.ok(elapsed >= 195, 'waited long enough: ' + elapsed)
					t.ok(elapsed <= 250, 'did not wait too long')
					t.end()
				})
			})
		})
	})
})
