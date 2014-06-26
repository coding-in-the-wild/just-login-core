var test = require('tap').test
var JustLoginCore = require('../index.js')
var Levelup = require('levelup')

var fakeId = "LOLThisIsAFakeSessionId"
var fakeAddress = "example@example.com"

test('test for the entire just-login core', function(t) {
	var levelup = Levelup('', { db: require('memdown') })
	var jlc = JustLoginCore(levelup)
	
	t.plan(11)
	
	jlc.isAuthenticated(fakeId, function (err, val) { //Not authenticated yet
		t.notOk(err, 'no error for isAuthenticated 1')
		t.notOk(val, 'no value came back')
	})
	jlc.beginAuthentication(fakeId, fakeAddress).on('auth', function(obj) {
		t.ok(obj.token, "Token exists")
		t.equal(obj.contactAddress, fakeAddress, "Adresses match")
		
		jlc.isAuthenticated(fakeId, function (err, val) { //Not authenticated yet
			t.notOk(err, 'no error for isAuthenticated 2')
			t.notOk(val, 'no value came back')
		})
		
		jlc.authenticate(obj.token, function(err, value) {
				t.notOk(err, 'no error for authenticate')
				t.ok(value, 'got a value back')
				//t.ok(value.contactAddress, 'contact address returned')
				//t.ok(value.sessionId, 'session id returned')
				//t.equal(value.contactAddress, fakeAddress, 'got back correct value')
				t.equal(value, fakeAddress, 'got back correct value')
			
			jlc.isAuthenticated(fakeId, function (err, val) { //Authenticated now
				t.notOk(err, 'no error for isAuthenticated 3')
				console.log("val.....")
				console.log(val)
				t.equal(val, fakeAddress, 'got address back')
				t.end()
			})
		})
	})
})
