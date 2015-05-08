var test = require('tape')
var spaces = require('level-spaces')
var JustLoginCore = require('../index.js')
var Levelup = require('level-mem')

var fakeSecretToken = 'hahalolthisisnotverysecretivenow'
var fakeCreds = {
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

	//authenticate(secret token, cb) -> sets the appropriate session id to be authenticated with the contact address associated with that secret token.
	//Calls the callback with null or the contact address depending on whether or not the login was successful

	t.plan(8)

	jlc.authenticate(fakeSecretToken, function (err, creds) { //token does not exist
		t.ok(err, 'there was an error')
		t.ok(err instanceof Error, "err is an Error")
		t.notOk(creds, 'nothing returned')

		db.put(fakeSecretToken, fakeCreds, dbTokenOpts, function (err) { //making token exist
			t.notOk(err, 'no err for put')

			db.get(fakeSecretToken, function (err, val) {
				console.log(err + val)
				jlc.authenticate(fakeSecretToken, function (err, creds) { //token exists
					t.notOk(err, 'no error in authenticate()')
					t.ok(creds, 'something returned')
					t.notEqual(creds, '[object Object]', 'should not be a string saying "[object Object]"')
					t.deepEqual(creds, fakeCreds, 'got back correct value')
					t.end()
				})
			})
		})
	})
})
