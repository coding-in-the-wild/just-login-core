var test = require('tap').test
var JustLoginCore = require('../index.js')
var Levelup = require('level-mem')

var fakeSecretToken = 'hahalolthisisnotverysecretivenow'
var fakeTokenData = {
	sessionId: 'whatever',
	contactAddress: 'example@example.com'
}

var dbTokenOpts = {
	keyEncoding: 'utf8',
	valueEncoding: 'json'
}

test('test for authenticate', function(t) {
	var levelup = Levelup('newThang')
	var jlc = JustLoginCore(levelup)
	
	//authenticate(secret token, cb) -> sets the appropriate session id to be authenticated with the contact address associated with that secret token.
	//Calls the callback with null or the contact address depending on whether or not the login was successful (same as isAuthenticated)

	t.plan(8)
	
	jlc.authenticate(fakeSecretToken, function(err, value) {
		t.ok(err, 'an error')
		t.ok(err.invalidToken, 'correct error')
		t.notOk(value, 'nothing returned')
	})
	
	levelup.put(fakeSecretToken, fakeTokenData, dbTokenOpts, function(err) {
		t.notOk(err, 'no err for put')

		jlc.authenticate(fakeSecretToken, function(err, value) {
			t.notOk(err, 'no error')
			t.ok(value, 'something returned')
			t.notEqual(value, '[object Object]', 'should not be a string saying "[object Object]"')
			t.equal(value, fakeTokenData.contactAddress, 'got back correct value')
			t.end()
		})
	})
})
