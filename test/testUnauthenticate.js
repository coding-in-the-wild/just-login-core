var test = require('tap').test
var JustLoginCore = require('../index.js')
var Levelup = require('level-mem')

var fakeSessionId = "LOLThisIsAFakeSessionId"

test('test for unauthenticate', function(t) {
	var levelup = Levelup('newThang')
	var jlc = JustLoginCore(levelup)
	
	t.plan(5)
	
	jlc.unauthenticate(fakeSessionId, function(err) { //not yet authenticated
		t.notOk(err, 'no error')
		t.equal(typeof err, "undefined", "error is undefined")
	
		levelup.put(fakeSessionId, "example@example.com", function(err) { //authenticate
			t.notOk(err, 'no error')

			jlc.unauthenticate(fakeSessionId, function(err) { //previously authenticated
				t.notOk(err, 'no error')
				t.equal(typeof err, "undefined", "error is undefined")
				t.end()
			})
		})
	})
	
})
