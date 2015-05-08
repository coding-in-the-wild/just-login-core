var test = require('tap').test
var spaces = require('level-spaces')
var JustLoginCore = require('../index.js')
var Levelup = require('level-mem')
var lock = require('level-lock')

var jlcOpts = {
	tokenGenerator: function () {
		return 'dumb token'
	}
}

test('beginAuthentication respects level-lock locks', function(t) {
	var db = Levelup('newThang')
	var jlc = JustLoginCore(db, jlcOpts)

	jlc.beginAuthentication('key', 'value', function (err) {
		t.notOk(err)
		var unlock = lock(db, 'dumb token', 'rw')
		t.ok(unlock, 'lock aquired')
		jlc.beginAuthentication('key', 'value', function (err) {
			t.ok(err, 'an error happened when locked')
			unlock && unlock()
			jlc.beginAuthentication('key', 'value', function (err) {
				console.log(err && err.message)
				t.notOk(err, 'no error after lock given up')
				t.end()
			})
		})
	})

})

test('authenticate respects level-lock locks', function(t) {
	var db = Levelup('newThang')
	var jlc = JustLoginCore(db, jlcOpts)

	jlc.authenticate('token', function (err) {
		t.notOk(err, 'first auth has no err' + (err && err.message))
		var unlock = lock(db, 'token', 'rw')
		t.ok(unlock, 'lock aquired')
		jlc.authenticate('token', function (err) {
			t.ok(err, 'an error happened when locked')
			unlock && unlock()
			jlc.authenticate('token', function (err) {
				t.notOk(err, 'no error after lock given up' + (err && err.message))
				t.end()
			})
		})
	})
})
