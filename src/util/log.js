'use strict';
const chalk = require('chalk');
const _ = require('lodash');

module.exports = function () {
	console.log.apply(null, arguments);
};

module.exports.info = function () {
	var args = _.map(arguments, (msg) => {
		return chalk.blue(msg);
	});
	console.info.apply(null, args);
};

module.exports.error = function () {
	var args = _.map(arguments, (msg) => {
		if (msg instanceof Error) {
			return chalk.bold.red(msg.stack);
		}
		else {
			return chalk.bold.red(msg);
		}
	});

	console.error.apply(null, args);
};

module.exports.warn = function () {
	var args = _.map(arguments, (msg) => {
		return chalk.yellow(msg);
	});
	console.warn.apply(null, args);
};

module.exports.good = function () {
	var args = _.map(arguments, (msg) => {
		return chalk.bold.green(msg);
	});
	console.info.apply(null, args);
};

module.exports.quiet = function () {
	if (process.env.NODE_ENV === 'test' && !process.env.DEBUG) {
		return;
	}

	var args = _.map(arguments, (msg) => {
		return chalk.dim.gray(msg);
	});
	console.info.apply(null, args);
};