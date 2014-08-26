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
	
	jlc.unauthenticate(fakeSessionId, function (err0) { //not yet authenticated
		t.notOk(err0, 'no error')
		t.equal(typeof err0, "undefined", "error is undefined")
	
		levelup.put(fakeSessionId, fakeEmail, function (err1) { //authenticate
			t.notOk(err1, 'no error')

			levelup.get(fakeSessionId, function (err2, email) { //make sure 'put' worked
				t.notOk(err2, 'no error')
				t.equal(email, fakeEmail, 'emails match')

				jlc.unauthenticate(fakeSessionId, function (err3) { //previously authenticated
					t.notOk(err3, 'no error')
					t.notOk(err3 && err3.notFound, 'no "not found" error')
					t.equal(typeof err3, "undefined", "error is undefined")

					levelup.get(fakeSessionId, function (err4, email) { //make sure unauth worked
						t.ok(err4, 'error')
						t.ok(err4 && err4.notFound, '"not found" error')
						t.notOk(email, 'no email came back')
						t.end()
					})
				})
			})
		})
	})
})
