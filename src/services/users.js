'use strict';
var db = require('./db');
var _ = require('lodash');
var config = require('../config');

module.exports = {
	model : db.User,

	get : function * (id) {
		let user = yield db.User.findById(id);
		if (!user) {
			return null;
		}
		else {
			return user;
		}
	},

	authenticate : function * (username, password) {
		let user = yield db.User.findOne({ where : { username : username } });
		if (user) {
			let isAuthenticated = yield db.User.verify(user.passwordHash, password, user.salt);
			if (isAuthenticated) {
				return user;
			}
			else {
				let error = new Error('invalid credentials');
				error.status = 401;
				throw error;
			}
		}
		else {
			let error = new Error('no user is registered with this username');
			error.status = 400;
			throw error;
		}
	},

	create : function * (registrationOptions) {
		let salt = yield db.User.salt();
		registrationOptions.salt = salt;

		let hash = yield db.User.hash(registrationOptions.password, registrationOptions.salt);
		registrationOptions.passwordHash = hash;

		delete registrationOptions.password;

		let user = yield db.User.create(registrationOptions);

		return user;
	},

	update : function * (id, options) {
		if (options.password) {
			let salt = yield db.User.salt();
			options.salt = salt;

			let hash = yield db.User.hash(options.password, options.salt);
			options.passwordHash = hash;

			delete options.password;
		}

		if (options.avatar) {
			// TODO: handle image file
			delete options.avatar;
		}
		
		let user = yield db.User.findById(id);

		if (!user) {
			let error = new Error('no user exists with this id');
			error.status = 404;
			throw error;
		}

		let result = yield user.update(options);

		return result;
	},

	delete : function * (id) {
		let user = yield db.User.findById(id);
		if (!user) {
			let error = new Error('no user exists with this id');
			error.status = 404;
			throw error;
		}

		yield user.destroy();
		return true;
	},

	list : function * (query) {
		let users = yield db.User.findAll({ where : query });
		return users;
	},

	view(instance) {
		var selfLink = `${config.serverUrl}/v1/users/${instance.id}`;
		var storiesLink = `${config.serverUrl}/v1/stories?authorId=${instance.id}`;

		return {
			id : instance.id,
			admin : instance.admin,
			username : instance.username,
			email : instance.email,
			avatarUrl : instance.avatarUrl,
			links : {
				self : selfLink,
				stories : storiesLink
			}
		};
	}
}