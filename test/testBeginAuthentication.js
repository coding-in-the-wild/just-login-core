var test = require('tap').test
var JustLoginCore = require('../index.js')
var Levelup = require('levelup')

var fakeId = "LOLThisIsAFakeSessionId"
var fakeAddress = "example@example.com"

test('test for beginAuthentication', function(t) {
	var levelup = Levelup('', { db: require('memdown') })
	var jlc = JustLoginCore(levelup)
	
	t.plan(2)
	jlc.beginAuthentication(fakeId, fakeAddress).on('auth', function(obj) {
		t.ok(obj.token, "Token exists")
		t.equal(obj.contactAddress, fakeAddress, "Adresses match")
		t.end()
	})

	//-> emits an event with a secret token and the contact address, so somebody can go send a message to that address
	
})
