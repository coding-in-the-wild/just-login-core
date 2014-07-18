var test = require('tap').test
var JustLoginCore = require('../index.js')
var Levelup = require('level-mem')

var fakeId = "LOLThisIsAFakeSessionId"
var fakeAddress = "example@example.com"

test('test for beginAuthentication', function(t) {
	var levelup = Levelup('newThang')
	var jlc = JustLoginCore(levelup)
	
	t.plan(3)
	jlc.beginAuthentication(fakeId, fakeAddress, function (err) {
		t.notOk(err, "no error")
	})

	jlc.on('authentication initiated', function(obj) {
		t.ok(obj.token, "Token exists")
		t.equal(obj.contactAddress, fakeAddress, "Adresses match")
	})

	//-> emits an event with a secret token and the contact address, so somebody can go send a message to that address
	
})
