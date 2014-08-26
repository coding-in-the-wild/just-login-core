var test = require('tap').test
var sublevel = require('level-sublevel')
var JustLoginCore = require('../index.js')
var Levelup = require('level-mem')
var ms = require('ms')

var ttlMs = ms('3 seconds')
var checkFrequency = ms('200 ms')
var fakeSecretToken = 'hahalolthisisnotverysecretivenow'
var fakeSessionId = 'whatever'
var fakeContactAddress = 'example@example.com'

function dumbTokenGen() {
	return fakeSecretToken
}

/*
tokenGenerator
tokenTtl
tokenTtlCheckFrequencyMs
sessionUnauthenticatedAfterMsInactivity
*/

var dbTokenOpts = {
	keyEncoding: 'utf8',
	valueEncoding: 'json'
}

test('test for authenticate', function (t) {
	var db = Levelup('newThang')
	var jlc = JustLoginCore(db, {
		tokenTtl: ttlMs,
		tokenGenerator: dumbTokenGen,
		tokenTtlCheckFrequencyMs: checkFrequency
	})

	db = sublevel(db).sublevel('token')

	jlc.beginAuthentication(fakeSessionId, fakeContactAddress, function (err0, credentials0) {
		t.notOk(err0, "no error in beginAuth()")
		t.notOk(err0 && err0.notFound, "no 'not found' error in beginAuth()")
		t.ok(credentials0, "credentials come back in beginAuth()")
		//t.deepEqual(credentials0, fakeTokenData, "credentials are correct in beginAuth()")
	})

	setTimeout(function () {
		console.log('hi')
		db.get(fakeSecretToken, dbTokenOpts, function (err1, credentials1) {
			console.log('world')
			t.notOk(err1, "no error in 1st db.get()")
			t.notOk(err1 && err1.notFound, "no 'not found' error in 1st db.get()")
			t.ok(credentials1, "credentials come back in 1st db.get()")
			//t.deepEqual(credentials1, fakeTokenData, "credentials are correct in 1st db.get()")
		})
		console.log('hello')
	}, ttlMs-checkFrequency*2)

	setTimeout(function () {
		console.log('nooooo')
		db.get(fakeSecretToken, dbTokenOpts, function (err2, credentials2) {
			console.log('error')
			console.dir(err2)
			console.log('creds')
			console.dir(credentials2)
			t.ok(err2, "error in 2nd db.get()")
			t.ok(err2 && err2.notFound, "'not found' error in 2nd db.get()")
			t.notOk(credentials2, "credentials don't come back in 2nd db.get()")
			//t.notDeepEqual(credentials2, fakeTokenData, "credentials are correct in 2nd db.get()")

			t.end()
		})
	}, ttlMs+checkFrequency*2)
})
