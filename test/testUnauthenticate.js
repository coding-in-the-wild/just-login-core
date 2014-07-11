var test = require('tap').test
var JustLoginCore = require('../index.js')
var Levelup = require('level-mem')

var fakeId = "LOLThisIsAFakeSessionId"
var fakeAddress = "example@example.com"


test('test for unauthenticate', function(t) {
	var levelup = Levelup('newThang')
	var jlc = JustLoginCore(levelup)
	
	t.plan(2)
	
	jlc.unauthenticate(fakeId, function(err) {
		t.notOk(err, 'no error')
		//t.ok(err.invalidToken, 'correct error')
	})
	
	levelup.put(fakeId, fakeAddress, function(err) {
		jlc.unauthenticate(fakeId, function(err) {
			t.notOk(err, 'no error')
			t.end()
		})
	})
	
})
