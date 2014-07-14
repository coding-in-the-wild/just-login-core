var test = require('tap').test
var JustLoginCore = require('../index.js')
var Levelup = require('level-mem')

var fakeId = "LOLThisIsAFakeSessionId"
var fakeAddress = "example@example.com"


test('test for unauthenticate', function(t) {
	var levelup = Levelup('newThang')
	var jlc = JustLoginCore(levelup)
	
	t.plan(3)
	
	jlc.unauthenticate(fakeId, function(err) { //not yet authenticated
		t.notOk(err, 'no error')
	
		levelup.put(fakeId, fakeAddress, function(err) { //authenticate
			t.notOk(err, 'no error')

			jlc.unauthenticate(fakeId, function(err) { //previously authenticated
				t.notOk(err, 'no error')
				t.end()
			})
		})
	})
	
})
