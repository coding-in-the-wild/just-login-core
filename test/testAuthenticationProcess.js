var test = require('tape')
var JustLoginCore = require('../index.js')
var Levelup = require('level-mem')

var expected = {
	sessionId: 'LOLThisIsAFakeSessionId',
	contactAddress: 'example@example.com'
}

test('test for the entire just-login core', function (t) {
	var jlc = JustLoginCore(new Levelup())

	t.plan(8)

	jlc.beginAuthentication(expected.sessionId, expected.contactAddress, function (err) {
		t.notOk(err, 'begin authentication, no error')
	})

	var creds = null
	jlc.on('authenticated', function (credentials) {
		creds = credentials
	})

	jlc.on('authentication initiated', function (credentials) {
		t.ok(credentials.token, 'Token exists')
		t.equal(credentials.contactAddress, expected.contactAddress, 'Addresses match')

		t.notOk(creds, 'not authenticated yet')
		creds = null

		jlc.authenticate(credentials.token, function (err, credentials) {
			t.notOk(err, 'no error for authenticate')
			t.ok(credentials, 'got a value back')
			t.deepEqual(credentials, expected, 'authenticated as correct user')
			t.deepEqual(creds, expected, 'authenticated as correct user`')
			t.end()
		})
	})
})
