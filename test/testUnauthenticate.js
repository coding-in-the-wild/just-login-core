var test = require('tap').test
var sublevel = require('level-sublevel')
var JustLoginCore = require('../index.js')
var Levelup = require('level-mem')

var fakeSessionId = "LOLThisIsAFakeSessionId"
var fakeEmail = "example@example.com"

test('test for unauthenticate', function(t) {
	var levelup = Levelup('newThang')
	var jlc = JustLoginCore(levelup)

	levelup = sublevel(levelup).sublevel('session')

	t.plan(11)
	
	jlc.unauthenticate(fakeSessionId, function (err) { //not yet authenticated
		t.notOk(err, 'no error')
		t.type(err, "null", "error is null")
	
		levelup.put(fakeSessionId, fakeEmail, function (err) { //authenticate
			t.notOk(err, 'no error')

			levelup.get(fakeSessionId, function (err, email) { //make sure 'put' worked
				t.notOk(err, 'no error')
				t.equal(email, fakeEmail, 'emails match')

				jlc.unauthenticate(fakeSessionId, function (err) { //previously authenticated
					t.notOk(err, 'no error')
					t.notOk(err && err.notFound, 'no "not found" error')
					t.type(err, "null", "error is null")

					levelup.get(fakeSessionId, function (err, email) { //make sure unauth worked
						t.ok(err, 'error')
						t.ok(err && err.notFound, '"not found" error')
						t.notOk(email, 'no email came back')
						t.end()
					})
				})
			})
		})
	})
})
