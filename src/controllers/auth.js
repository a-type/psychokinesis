'use strict';
var passport = require('koa-passport');
var users = require('../services/users');

let login = function * (next) {
	var self = this;

	yield passport.authenticate('local', function * (err, user, info) {
		if (err) throw err;

		if (!user) {
			// theoretically this should not happen, unless users.authenticate changes
			self.status = 401;
			self.body = { error : 'bad credentials' };
		}
		else {
			yield self.login(user);
			self.status = 200;
			self.body = users.view(user);
		}
	}).call(this, next);
};

let logout = function * () {
	this.logout();
	this.status = 200;
	this.body = { message : 'logged out' };
};

module.exports = {
	local : {
		login : login,
		logout : logout
	}
};