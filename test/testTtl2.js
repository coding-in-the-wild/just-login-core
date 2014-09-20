var test = require('tap').test
var sublevel = require('level-sublevel')
var Levelup = require('level-mem')
var ms = require('ms')

var ttlMs = ms('3 seconds')
var checkInterval = ms('100 ms')
var checkWindow = ms('250ms')
var fakeToken = 'hahalolthisisnotveryivenow'
var fakeContactAddress = 'example@example.com'
var fakeSessionId = 'whatever'
var fakeTokenData = {
	sessionId: fakeSessionId,
	contactAddress: fakeContactAddress
}


test('test for authenticate', function (t) {
	var db = Levelup('newThang')
	db = sublevel(db)

	//NO USING THESE VARS vvv (faking the just-login-core below...)
	var options = {
		tokenTtl: ttlMs,
		tokenTtlCheckIntervalMs: checkInterval
	}
	var ttl = require('tiny-level-ttl')
	var _JLCtokenDb = db.sublevel('token')
	ttl(_JLCtokenDb, {
		ttl: options.tokenTtl,
		checkInterval: options.tokenTtlCheckIntervalMs
	})
	_JLCtokenDb.on('put', function (key) {
		console.log('jlc sees put:',key)
	})
	//NO USING THESE VARS ^^^

	var dbTokenOpts = {
		keyEncoding: 'utf8',
		valueEncoding: 'json'
	}

	var tokenDb = db.sublevel('token')

	tokenDb.put(fakeToken, fakeTokenData, dbTokenOpts, function (err) {
		t.notOk(err, "no error in db.put()")
	})

	setTimeout(function () {
		tokenDb.get(fakeToken, dbTokenOpts, function (err, credentials) {
			t.notOk(err, "no error in 1st db.get()")
			t.notOk(err && err.notFound, "no 'not found' error in 1st db.get()")
			t.ok(credentials, "credentials come back in 1st db.get()")
			t.deepEqual(credentials, fakeTokenData, "credentials are correct in 1st db.get()")
		})
	}, ttlMs-checkWindow)

	setTimeout(function () {
		tokenDb.get(fakeToken, dbTokenOpts, function (err, credentials) {
			//t.type(err, 'object', "err is an object")
			//t.ok(err instanceof Error, "err is an error in 2nd db.get()")
			t.ok(err, "error in 2nd db.get()")
			t.ok(err && err.notFound, "'not found' error") //enable this later
			t.type(credentials, 'undefined') //enable this later
			t.notOk(credentials, "credentials don't come back") //enable this later
			t.notDeepEqual(credentials, fakeTokenData, "credentials are incorrect") //enable this later

			t.end()
		})
	}, ttlMs+checkWindow)
	

})
