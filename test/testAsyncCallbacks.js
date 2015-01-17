var test = require('tap').test
var spaces = require('level-spaces')
var JustLoginCore = require('../index.js')
var Levelup = require('level-mem')
var lock = require('level-lock')

var dumbSession = 'rolling stones or stone trolls'
var dumbToken = 'the one test to rule them all'
var jlcOpts = {
	tokenGenerator: function () {
		return dumbToken
	}
}

test('plan to bring the ring to mordor (beginAuth)', function(t) {
	var db = Levelup('newThang')
	var jlc = JustLoginCore(db, jlcOpts)
	var tdb = spaces(db, 'token', {valueEncoding: 'json'})

	var x = false, y = false, z = false
	jlc.beginAuthentication('Hobbit:', 'The unexpected value', function (err) { x = err || true })
	var unlock = lock(tdb, dumbToken, 'rw')
	jlc.beginAuthentication('Hobbit:', 'The unexpected value', function (err) { y = err || true })
	unlock()
	jlc.beginAuthentication(null, null, function (err) { z = err || true })

	t.equal(false, x, 'mount doom')
	t.equal(false, y, 'gaaannndallfff!!')
	t.equal(false, z, 'they stole it from ussss!!!!!')
	t.end()
})

test('bring the ring in mordor (authenticate)', function(t) {
	var db = Levelup('newThang')
	var jlc = JustLoginCore(db, jlcOpts)
	var tdb = spaces(db, 'token', {valueEncoding: 'json'})

	var x = false, y = false, z = false
	jlc.authenticate('token wrote lotr', function (err, value) { x = err || true })
	var unlock = lock(tdb, dumbToken, 'rw')
	jlc.authenticate('token wrote lotr', function (err, value) { y = err || true })
	unlock()
	jlc.authenticate(null, function (err, value) { z = err || true })

	t.equal(false, x, 'mount doom')
	t.equal(false, y, 'gaaannndallfff!!')
	t.equal(false, z, 'they stole it from ussss!!!!!')

	t.end()
})

//token ----^
//session --v

test('check if the ring is being brought to mordor (isAuth)', function(t) {
	var db = Levelup('newThang')
	var jlc = JustLoginCore(db, jlcOpts)
	var sdb = spaces(db, 'session')

	var x = false, y = false, z = false
	jlc.isAuthenticated(dumbSession, function (err, value) { x = err || true })
	var unlock = lock(sdb, dumbSession, 'rw')
	jlc.isAuthenticated(dumbSession, function (err, value) { y = err || true })
	unlock()
	jlc.isAuthenticated(null, function (err, value) { z = err || true })

	t.equal(false, x, 'mount doom')
	t.equal(false, y, 'gaaannndallfff!!')
	t.equal(false, z, 'they stole it from ussss!!!!!')

	t.end()
})

test('throw the ring into mount doom (unauth)', function(t) {
	var db = Levelup('newThang')
	var jlc = JustLoginCore(db, jlcOpts)
	var sdb = spaces(db, 'session')

	var x = false, y = false, z = false
	jlc.unauthenticate(dumbSession, function (err, value) { x = err || true })
	var unlock = lock(sdb, dumbSession, 'rw')
	jlc.unauthenticate(dumbSession, function (err, value) { y = err || true })
	unlock()
	jlc.unauthenticate(null, function (err, value) { z = err || true })

	t.equal(false, x, 'mount doom')
	t.equal(false, y, 'gaaannndallfff!!')
	t.equal(false, z, 'they stole it from ussss!!!!!')

	t.end()
})

