var test = require('tape')
var JustLoginCore = require('../index.js')
var Levelup = require('level-mem')

var ttlMs = 200
var checkInterval = 50
var checkWindow = 75
var fakeToken = 'hahalolthisisnotveryivenow'
var fakeContactAddress = 'example@example.com'
var fakeSessionId = 'whatever'
var fakeTokenData = {
	sessionId: fakeSessionId,
	contactAddress: fakeContactAddress
}

function dumbTokenGen() {
	return fakeToken
}

test('time to live is applied', function (t) {
	var db = Levelup()
	var jlc = JustLoginCore(db, {
		tokenGenerator: dumbTokenGen,
		tokenTtl: ttlMs,
		tokenTtlCheckIntervalMs: checkInterval
	})
	var dbTokenOpts = {
		keyEncoding: 'utf8',
		valueEncoding: 'json'
	}


	jlc.beginAuthentication(fakeSessionId, fakeContactAddress, function (err, credentials) {
		t.notOk(err, "no error in beginAuth()")
		t.notOk(err && err.notFound, "no 'not found' error in beginAuth()")
		t.ok(credentials, "credentials come back in beginAuth()")
	})

	//db.put(fakeToken, fakeTokenData, dbTokenOpts, function (err) {
	//	t.notOk(err, "no error in db.put()")
	//})

	setTimeout(function () {
		db.get(fakeToken, dbTokenOpts, function (err, credentials) {
			if (typeof credentials === 'string') {
				credentials = JSON.parse(credentials)
			}
			t.notOk(err, "no error in 1st db.get()")
			t.notOk(err && err.notFound, "no 'not found' error in 1st db.get()")
			t.ok(credentials, "credentials come back in 1st db.get()")
			t.deepEqual(credentials, fakeTokenData, "credentials are correct in 1st db.get()")
		})
	}, ttlMs - checkWindow)

	setTimeout(function () {
		db.get(fakeToken, dbTokenOpts, function (err, credentials) {
			t.equal(typeof err, 'object', "err is an object")
			t.ok(err instanceof Error, "err is an error in 2nd db.get()")
			t.ok(err, "error in 2nd db.get()")
			t.ok(err && err.notFound, "'not found' error")
			t.equal(typeof credentials, 'undefined', 'credentials are undefined')
			t.notOk(credentials, "credentials don't come back")
			t.notDeepEqual(credentials, fakeTokenData, "credentials are incorrect")

			t.end()
		})
	}, ttlMs + checkWindow)

})
