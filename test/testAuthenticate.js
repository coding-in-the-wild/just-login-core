var test = require('tap').test
var sublevel = require('level-sublevel')
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
	var db = Levelup('newThang')
	var jlc = JustLoginCore(db)
	db = sublevel(db).sublevel('token')
	
	//authenticate(secret token, cb) -> sets the appropriate session id to be authenticated with the contact address associated with that secret token.
	//Calls the callback with null or the contact address depending on whether or not the login was successful (same as isAuthenticated)

	t.plan(8)
	
	jlc.authenticate(fakeSecretToken, function (err, value) { //token does not exist
		t.ok(err, 'there was an error')
		t.ok(err instanceof Error, "err is an Error")
		t.notOk(value, 'nothing returned')
	
		db.put(fakeSecretToken, fakeTokenData, dbTokenOpts, function (err) { //making token exist
			t.notOk(err, 'no err for put')

			jlc.authenticate(fakeSecretToken, function (err, credentials) { //token exists
				t.notOk(err, 'no error in authenticate()')
				t.ok(credentials, 'something returned')
				t.notEqual(credentials, '[object Object]', 'should not be a string saying "[object Object]"')
				t.deepEqual(credentials, fakeTokenData, 'got back correct value')
				t.end()
			})
		})
	})
})
