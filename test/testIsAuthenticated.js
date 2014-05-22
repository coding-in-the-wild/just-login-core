var test = require('tap').test
var JustLoginCore = require('../index.js')
var Levelup = require('levelup')

var fakeId = "LOLThisIsAFakeSessionId"
var fakeAddress = "example@example.com"


test('test for isAuthenticated', function(t) {
	var levelup = Levelup('', { db: require('memdown') })
	var jlc = JustLoginCore(levelup)
	
	t.plan(5)
	
	jlc.isAuthenticated(fakeId, function(err, value) {
		t.notOk(err, 'no error')
		t.notOk(value, 'not in db')
	})
	
	levelup.put(fakeId, fakeAddress) //no callback needed, because memdown is instantaneous
	
	jlc.isAuthenticated(fakeId, function(err, value) {
		t.notOk(err, 'no error')
		t.ok(value, 'got a value')
		t.equal(value, fakeAddress, 'got back correct value')
		t.end()
	})
})
