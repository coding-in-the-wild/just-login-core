var test = require('tap').test
var JustLoginCore = require('../index.js')
var Levelup = require('levelup')

test('test for um', function(t) {
	var justLoginCore = JustLoginCore(Levelup('', { db: require('memdown') }))
	
	//isAuthenticated(session id, cb) -> calls the callback with null or a contact address if authenticated
	
	t.end()
})
