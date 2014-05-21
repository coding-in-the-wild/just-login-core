var test = require('tap').test
var JustLoginCore = require('../index.js')
var Levelup = require('levelup')

var fakeSecretToken = 'hahalolthisisnotverysecretive'

test('test for authenticate', function(t) {
	var levelup = Levelup('', { db: require('memdown') })
	var jlc = JustLoginCore(levelup)
	
	//authenticate(secret token, cb) -> sets the appropriate session id to be authenticated with the contact address associated with that secret token.
	//Calls the callback with null or the contact address depending on whether or not the login was successful (same as isAuthenticated)

	
	//t.plan(4)
	//t.notOk(true, 'this test is not finished!')
	
	jlc.authenticate(fakeSecretToken, function(err, value) {
		//t.notOk(err, 'no error')
		//t.notOk(value, 'not in db')
	})
	
	levelup.put(fakeSecretToken, 'hahahahahahahahahahahahahahahah') //no callback needed, because memdown is instantaneous
	
	jlc.authenticate(fakeSecretToken, function(err, value) {
		//t.notOk(err, 'no error')
		//t.equal(value, fakeAddress, 'got back correct value')
		//t.end()
	})
	t.end() //delete this later, i think
})
