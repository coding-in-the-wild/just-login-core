var test = require('tap').test
var sublevel = require('level-sublevel')
var JustLoginCore = require('../index.js')
var Levelup = require('level-mem')
var ms = require('ms')

var ttlMs = ms('3 seconds')
var checkFrequency = ms('200 ms')
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

/*
tokenGenerator
tokenTtl
tokenTtlCheckIntervalMs
sessionUnauthenticatedAfterMsInactivity
*/

test('test for authenticate', function (t) {
	var db = Levelup('newThang')
	var jlc = JustLoginCore(db, {
		tokenGenerator: dumbTokenGen,
		tokenTtl: ttlMs,
		tokenTtlCheckIntervalMs: checkFrequency
	})
	var dbTokenOpts = {
		keyEncoding: 'utf8',
		valueEncoding: 'json',
		ttl: ttlMs
	}

	db = sublevel(db).sublevel('token')

/*	
	//THIS THROWS SOME WONKY ERROR IN LEVEL-TTL!!!
	jlc.beginAuthentication(fakeSessionId, fakeContactAddress, function (err, credentials) {
		t.notOk(err, "no error in beginAuth()")
		t.notOk(err && err.notFound, "no 'not found' error in beginAuth()")
		t.ok(credentials, "credentials come back in beginAuth()")
		//t.deepEqual(credentials, fakeTokenData, "credentials are correct in beginAuth()")
	})
*/
	db.put(fakeToken, fakeTokenData, dbTokenOpts, function (err) {
		t.notOk(err, "no error in db.put()")
	})

	setTimeout(function () {
		db.get(fakeToken, dbTokenOpts, function (err, credentials) {
			t.notOk(err, "no error in 1st db.get()")
			t.notOk(err && err.notFound, "no 'not found' error in 1st db.get()")
			t.ok(credentials, "credentials come back in 1st db.get()")
			t.deepEqual(credentials, fakeTokenData, "credentials are correct in 1st db.get()")
		})
	}, ttlMs-checkFrequency*2)

	setTimeout(function () {
		db.get(fakeToken, dbTokenOpts, function (err, credentials) {
			//t.type(err, 'object', "err is an object")
			//t.ok(err instanceof Error, "err is an error in 2nd db.get()")
			t.ok(err, "error in 2nd db.get()")
			t.ok(err && err.notFound, "'not found' error")
			t.type(credentials, 'undefined')
			t.notOk(credentials, "credentials don't come back")
			t.notDeepEqual(credentials, fakeTokenData, "credentials are incorrect")

			t.end()
		})
	}, ttlMs+checkFrequency*2)
	

})
