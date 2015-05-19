var test = require('tape')
var JustLoginCore = require('../index.js')
var Levelup = require('level-mem')

var fakeId = "LOLThisIsAFakeSessionId"
var fakeAddress = "example@example.com"

test('test for beginAuthentication', function(t) {
	var jlc = JustLoginCore(new Levelup())

	t.plan(23)
	jlc.beginAuthentication(fakeId, fakeAddress, function (err, authReqInfo) { //O = One
		t.notOk(err, "O - no error")
		t.ok(authReqInfo.token, "O - Token exists")
		t.ok(authReqInfo.contactAddress, "O - Contact Address exists")
		t.equal(fakeAddress, authReqInfo.contactAddress, "O - Addresses match")

		t.equal(typeof authReqInfo.token, "string", "O - Token is a string")
		t.equal(typeof authReqInfo.contactAddress, "string", "O - Contact Address is a string")

		jlc.beginAuthentication(fakeId, fakeAddress, function (err, authReqInfo2) { //T = Two
			t.notOk(err, "T - no error")
			t.ok(authReqInfo2.token, "T - Token exists")
			t.ok(authReqInfo2.contactAddress, "T - Contact Address exists")
			t.equal(fakeAddress, authReqInfo2.contactAddress, "T - Addresses match")

			t.equal(typeof authReqInfo2.token, "string", "T - Token is a string")
			t.equal(typeof authReqInfo2.contactAddress, "string", "T - Contact Address is a string")

			t.notEqual(authReqInfo.token, authReqInfo2.token, "T - Default token-gen generates unique strings.")
		})
	})

	jlc.on('authentication initiated', function(obj) { //E = Event
		t.ok(obj.token, "E - Token exists")
		t.ok(obj.contactAddress, "E - Contact Address exists")
		t.equal(obj.contactAddress, fakeAddress, "E - Adresses match")

		t.equal(typeof obj.token, "string", "E - Token is a string")
		t.equal(typeof obj.contactAddress, "string", "E - Contact Address is a string")
	})

	//-> emits an event with a secret token and the contact address, so somebody can go send a message to that address

})
