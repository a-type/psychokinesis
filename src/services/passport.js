'use strict';
const passport = require('koa-passport');
const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-auth').Strategy;
const config = require('../config');
const users = require('./users');
const co = require('co');
const log = require('../util/log');

passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser((id, done) => {
	return co(users.get(id))
	.then((user) => {
		if (!user) {
			// perhaps user was deleted
			done(null, false);
		}
		else {
			done(null, user);
		}
	})
	.catch((err) => {
		log.error(err);
		done(err, null);
	});
});

passport.use(new LocalStrategy((username, password, done) => {
	// TODO: Redis cache
	return co(users.authenticate(username, password))
	.then((user) => {
		if (user) {
			done(null, user);
		}
		else {
			done(null, false);
		}
	})
	.catch((error) => {
		if (error.status && error.status !== 500) {
			done(null, false, { message : error.message });
		}
		else {
			log.error(error);
			done(error);
		}
	});
}));

// TODO

/*
passport.use(new FacebookStrategy({
		clientID : config.facebook.clientId,
		clientSecret : config.facebook.clientSecret,
		callbackURL : config.host + ':' + config.port + '/auth/facebook/callback'
	},
	(token, tokenSecret, profile, done) => {
		// TODO retrieve user...
		let user;
		done(null, user);
	}
));

passport.use(new GoogleStrategy({
		clientId : config.google.clientId,
		clientSecret : config.google.clientSecret,
		callbackURL : config.host + ':' + config.port + '/auth/google/callback'
	},
	function (token, tokenSecret, profile, done) {
		// TODO retrieve user...
		let user;
		done(null, user);
	}
));
*/