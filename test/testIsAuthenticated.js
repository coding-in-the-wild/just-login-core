var test = require('tap').test
var spaces = require('level-spaces')
var JustLoginCore = require('../index.js')
var Levelup = require('level-mem')

var fakeId = "LOLThisIsAFakeSessionId"
var fakeAddress = "example@example.com"


test('test for isAuthenticated', function(t) {
	var db = Levelup('newThang')
	var jlc = JustLoginCore(db)
	db = spaces(db, 'session')
	
	t.plan(6)
	
	jlc.isAuthenticated(fakeId, function(err, value) {
		t.notOk(err, 'no error')
		t.notOk(value, 'not in db')
		db.put(fakeId, fakeAddress, function (err) {
			t.notOk(err, "no error")
			jlc.isAuthenticated(fakeId, function(err, value) {
				t.notOk(err, 'no error')
				t.ok(value, 'got a value')
				t.equal(value, fakeAddress, 'got back correct value')
				t.end()
			})
		})
	})
})
