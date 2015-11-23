'use strict';
const Bluebird = require('bluebird');
const request = require('superagent');
const config = require('../../src/config');
const fixtures = require('./fixtures');
const db = require('../../src/services/db');
const _ = require('lodash');
const co = require('co');
const log = require('../../src/util/log');

Bluebird.promisifyAll(request);

request.Request.prototype.exec = function () {
	var req = this
	return new Bluebird (function (resolve, reject) {
		req.end(function (er, res) {
			if (er) return reject(er)
			resolve(res)
		});
	});
};

let anonymousAgent = new request.agent(),
	defaultAgent = new request.agent(),
	adminAgent = new request.agent();

function * createAdmin () {
	let adminOptions = _.clone(fixtures.users.admin);

	let salt = yield db.User.salt();
	adminOptions.salt = salt;

	let hash = yield db.User.hash(adminOptions.password, adminOptions.salt);
	adminOptions.passwordHash = hash;

	delete adminOptions.password;

	let user = yield db.User.create(adminOptions);

	return user;
}

function resolvePath (path) {
	return config.host + ':' + config.port + path;
}

function agentRequest (agent, method, url, payload) {
	if (payload) {
		return agent[ method ](resolvePath(url))
		.send(payload)
		.exec();
	}
	else {
		return agent[ method ](resolvePath(url))
		.exec();
	}
}

function loginAgent (agent, user) {
	return agent.post(resolvePath('/v1/auth/local/logout'))
	.exec()
	.catch((err) => {
		log.error(`error logging out`);
		log.error(JSON.stringify(err));
	})
	.then(() => {
		delete agent.user;

		return agent.post(resolvePath('/v1/auth/local/login'))
		.send({
			username : user.username,
			password : user.password
		})
		.exec();
	})
	.then((userResponse) => {
		agent.user = userResponse.res.body;
		return agent;
	})
	.catch((error) => {
		if (error.status === 401) {
			return agent.post(resolvePath('/v1/users'))
			.send({
				username : user.username,
				password : user.password,
				email : user.email
			})
			.exec()
			.then((userResponse) => {
				return agent.post(resolvePath('/v1/auth/local/login'))
				.send({
					username : user.username,
					password : user.password
				})
				.exec()
				.then(() => {
					agent.user = userResponse.res.body;
					return agent;
				});
			})
			.catch((error) => {
				log.error(`Error creating fixture user ${user.username}`);
				log.error(JSON.stringify(error.response.body));
				throw error;
			});
		}
		else {
			log.error(`Error logging in ${user.username}`);
			log.error(JSON.stringify(error.response.res.body));
			throw error;
		}
	});
}

module.exports = {
	agents : {
		anon : {
			agent : anonymousAgent,
			request (method, url, payload) {
				return agentRequest(anonymousAgent, method, url, payload);
			}
		},

		default : {
			agent : defaultAgent,
			request (method, url, payload) {
				return agentRequest(defaultAgent, method, url, payload);
			}
		},

		admin : {
			agent : adminAgent,
			request (method, url, payload) {
				return agentRequest(adminAgent, method, url, payload);
			}
		}
	},

	init () {
		return loginAgent(defaultAgent, fixtures.users.default)
		.then(() => {
			log.good(`agent logged in for ${fixtures.users.default.username}`);
			module.exports.agents.default.user = defaultAgent.user;
			return co(createAdmin);
		})
		.then(() => {
			return loginAgent(adminAgent, fixtures.users.admin);
		})
		.then(() => {
			log.good(`agent logged in for admin ${fixtures.users.admin.username}`);
			module.exports.agents.admin.user = adminAgent.user;
		});
	},

	dropUsers () {
		return db.User.drop()
		.then(() => {
			return db.client.sync();
		});
	},

	resolvePath : resolvePath,

	createAgent : loginAgent.bind(null, request.agent()),
	agentRequest : agentRequest,

	deleteUser (user) {
		var agent = request.agent();
		return loginAgent(agent, user)
		.then((agent) => {
			return agentRequest(agent, 'del', `/v1/users/${agent.user.id}`);
		});
	}
};