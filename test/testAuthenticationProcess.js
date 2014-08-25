var test = require('tap').test
var JustLoginCore = require('../index.js')
var Levelup = require('level-mem')

var expected = {
	sessionId: "LOLThisIsAFakeSessionId",
	contactAddress: "example@example.com"
}

test('test for the entire just-login core', function (t) {
	var levelup = Levelup('newThang')
	var jlc = JustLoginCore(levelup)
	
	t.plan(15)
	
	jlc.isAuthenticated(expected.sessionId, function (err, address) { //Not authenticated yet
		t.notOk(err, 'no error for isAuthenticated 1')
		t.notOk(address, 'no value came back')
		
		jlc.beginAuthentication(expected.sessionId, expected.contactAddress, function (err){
			t.notOk(err)
		})

		jlc.on('authentication initiated', function (credentials) {
			t.ok(credentials.token, "Token exists")
			t.equal(credentials.contactAddress, expected.contactAddress, "Adresses match")
			
			jlc.isAuthenticated(expected.sessionId, function (err, address) { //Not authenticated yet
				t.notOk(err, 'no error for isAuthenticated 2')
				t.notOk(address, 'no value came back')
			})
			
			jlc.authenticate(credentials.token, function (err, credentials) {
				t.notOk(err, 'no error for authenticate')
				t.ok(credentials, 'got a value back')
				t.deepEqual(credentials, expected, 'got back correct value')
				
				jlc.isAuthenticated(expected.sessionId, function (err, address) { //Authenticated now
					t.notOk(err, 'no error for isAuthenticated 3')
					t.equal(address, expected.contactAddress, 'got address back')

					jlc.unauthenticate(expected.sessionId, function (err) {
						t.notOk(err)

						jlc.isAuthenticated(expected.sessionId, function (err, address) { //Not authenticated yet
							t.notOk(err, 'no error for isAuthenticated 2')
							t.notOk(address, 'no value came back')
							t.end()
						})
					})
				})
			})
		})
	})
})
