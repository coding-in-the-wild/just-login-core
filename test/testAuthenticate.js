var test = require('tap').test
var JustLoginCore = require('../index.js')
var Levelup = require('levelup')

var fakeSecretToken = 'hahalolthisisnotverysecretive'
var fakeId = 'whatever'
var fakeAddress = 'example@example.com'

test('test for authenticate', function(t) {
	var levelup = Levelup('', { db: require('memdown') })
	var jlc = JustLoginCore(levelup)
	
	//authenticate(secret token, cb) -> sets the appropriate session id to be authenticated with the contact address associated with that secret token.
	//Calls the callback with null or the contact address depending on whether or not the login was successful (same as isAuthenticated)

	t.plan(7)
	
	jlc.authenticate(fakeSecretToken, function(err, value) {
		t.notOk(err, 'no error')
		t.notOk(value, 'nothing returned')
	})
	
	levelup.put(fakeSecretToken, JSON.stringify({
		sessionId: fakeId,
		contactAddress: fakeAddress
	}), function(err) {
		t.notOk(err, 'no err for put')
	}) //no callback needed, because memdown is instantaneous
	
	jlc.authenticate(fakeSecretToken, function(err, value) {
		t.notOk(err, 'no error')
		t.ok(value, 'something returned')
		t.notEqual(value, '[object Object]', 'should not be a string saying "[object Object]"')
		//t.ok(value.contactAddress, 'contact address returned')
		//t.ok(value.sessionId, 'session id returned')
		//t.equal(value.contactAddress, fakeAddress, 'got back correct value')
		t.equal(value, fakeAddress, 'got back correct value')
		t.end()
	})
	//t.end() //delete this later, i think
})
