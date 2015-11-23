/* global describe, after, it, before */

'use strict';
var Bluebird = require('bluebird');
var common = require('./common');

var server;

before(function () {
	let serverPromise = require('../../src/app');
	return serverPromise
	.then((srv) => {
		server = srv;

		return common.dropUsers();
	})
	.then(() => {
		return common.init();
	});
});

after(function () {
	server.close();

	return common.dropUsers();
});