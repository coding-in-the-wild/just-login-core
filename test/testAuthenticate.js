var test = require('tap').test
var JustLoginCore = require('../index.js')
var Levelup = require('levelup')

test('test for um', function(t) {
	var justLoginCore = JustLoginCore(Levelup('', { db: require('memdown') }))
	
	//authenticate(secret token, cb) -> sets the appropriate session id to be authenticated with the contact address associated with that secret token.
	//Calls the callback with null or the contact address depending on whether or not the login was successful (same as isAuthenticated)
	
	t.end()
})
