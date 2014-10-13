var test = require('tap').test
var spaces = require('level-spaces')
var JustLoginCore = require('../index.js')
var Levelup = require('level-mem')
var ms = require('ms')

var touchAfterMs = ms('3 seconds') //must be smaller than timeoutMs
var timeoutMs = ms('5 seconds')
var checkIntervalMs = ms('200 ms')
var testWindowMs = ms('300 ms') //must be larger than checkIntervalMs
var fakeSessionId = 'whatever'
var fakeContactAddress = 'example@example.com'

test('test for authenticate', function (t) {
	var db = Levelup('newThang')
	var jlc = JustLoginCore(db, {
		sessionUnauthenticatedAfterMsInactivity: timeoutMs,
		sessionTimeoutCheckIntervalMs: checkIntervalMs
	})

	db = spaces(db, 'session')

	jlc.beginAuthentication(fakeSessionId, fakeContactAddress, function (err, credentials) {
		t.notOk(err, "no error in beginAuth()")
		t.ok(credentials, 'credentials came back')
		t.ok(credentials && credentials.token, '"credentials" has "token"')
		t.ok(credentials && credentials.contactAddress, '"credentials" has "contactAddress"')
		t.equal(credentials && credentials.contactAddress, fakeContactAddress, "contact addresses are identical")
		jlc.authenticate(credentials.token, function (err0, credentials0) {
			t.notOk(err0, "no error in beginAuth()")
			t.notOk(err0 && err0.notFound, "no 'not found' error in authenticate()")
			t.ok(credentials0, "credentials come back in authenticate()")
			t.equal(credentials0 && credentials0.contactAddress, fakeContactAddress, "credentials are correct in authenticate()")
		})
	})

	setTimeout(function () {
		jlc.isAuthenticated(fakeSessionId, function (err, contactAddress) {
			t.notOk(err, "no error")
			t.ok(contactAddress, "contactAddress came back")
			t.equal(contactAddress, fakeContactAddress, "contactAddress is correct")
		})
	}, touchAfterMs)
	
	setTimeout(function () {
		db.get(fakeSessionId, function (err1, address1) {
			t.notOk(err1, "no error in 1st db.get()")
			t.notOk(err1 && err1.notFound, "no 'not found' error in 1st db.get()")
			t.ok(address1, "address come back in 1st db.get()")
			t.equal(address1, fakeContactAddress, "address are correct in 1st db.get()")
		})
	}, touchAfterMs + timeoutMs - testWindowMs)

	setTimeout(function () {
		db.get(fakeSessionId, function (err2, address2) {
			t.ok(err2, "error in 2nd db.get()")
			t.ok(err2 && err2.notFound, "'not found' error in 2nd db.get()")
			t.notOk(address2, "credentials don't come back in 2nd db.get()")
			t.notEqual(address2, fakeContactAddress, "address is correct in 2nd db.get()")

			t.end()
		})
	}, touchAfterMs + timeoutMs + testWindowMs)
})
