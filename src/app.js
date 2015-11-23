'use strict';
var koa = require('koa');

// third-party middleware
var logger = require('koa-logger');
var passport = require('koa-passport');
var bodyparser = require('koa-bodyparser');
var session = require('koa-session');

// utility / libraries
var co = require('co');
var log = require('./util/log');
var config = require('./config');
var Path = require('path');

// first-party middleware
var controllers = require('./controllers');

// services
var db = require('./services/db');
require('./services/passport');

var app = koa();
app.keys = [ config.session.secret ];

// error handling
app.use(function * (next) {
	try {
		yield next;
	}
	catch (err) {
		this.status = err.status || 500;

		if (this.status === 500) {
			log.error(err);
		}

		this.body = { error : this.status === 500 ? 'Internal Server Error' : err.message };
	}
});

// hide logging output while testing, overridden by 'DEBUG' env var
if (process.env.NODE_ENV !== 'test' || process.env.DEBUG) {
	app.use(logger());
}

app.use(bodyparser());
app.use(session(app));

app.use(passport.initialize());
app.use(passport.session());

// route definitions
app.use(controllers.middleware());

module.exports = co(function * () {
	log('connecting to db...');
	try {
		var connection = yield db.client.sync();
		if (connection) {
			log.info('db connected');
			let server = app.listen(config.port);
			log.good('app listening on ' + config.port);

			return server;
		}
		else {
			log.error('db connection failed');
		}
	}
	catch (ex) {
		log.error(ex.stack);
	}
});