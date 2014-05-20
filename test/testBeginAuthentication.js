var test = require('tap').test
var JustLoginCore = require('../index.js')
var Levelup = require('levelup')

test('test for um', function(t) {
	var justLoginCore = JustLoginCore(Levelup('', { db: require('memdown') }))
	
	//beginAuthentication(session id, contact address) -> emits an event with a secret token and the contact address, so somebody can go send a message to that address
	
	t.end()
})
