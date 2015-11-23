/* global describe, after, it, before */

'use strict';
const common = require('./common');
const expect = require('chai').expect;
const uuid = require('uuid4');
const _ = require('lodash');

describe('the users resource', () => {
	describe('creating a user', () => {
		describe('with valid values', () => {
			var user = {
				username : 'testCreateUser',
				password : 'testCreatePassword',
				email : 'testcreateemail@email.com'
			};

			after(() => {
				return common.deleteUser(user);
			});

			it('returns the user view', () => {
				return common.agents.anon.request('post', '/v1/users', user)
				.then((result) => {
					expect(result.statusCode).to.equal(200);
					expect(result.res.body.username).to.equal(user.username);
					expect(result.res.body).to.not.have.property('password');
					expect(result.res.body).to.not.have.property('salt');
					expect(result.res.body.email).to.equal(user.email);
				});
			});
		});

		describe('with invalid values', () => {
			it('returns a 400', () => {
				return common.agents.anon.request('post', '/v1/users/', {
					foo : 'bar'
				})
				.catch((result) => {
					expect(result.response.statusCode).to.equal(400);
					expect(result.response.res.body.error).to.match(/required/i);
				});
			});
		});
	});

	describe('getting a user', () => {
		describe('which exists', () => {
			var user = {
				username : 'testGetUser',
				password : 'testGetPassword',
				email : 'testgetemail@email.com'
			};

			after(() => {
				return common.deleteUser(user);
			});

			it('returns a user view', () => {
				return common.agents.anon.request('post', '/v1/users', user)
				.then((result) => {
					return common.agents.anon.request('get', `/v1/users/${result.res.body.id}`);
				})
				.then((result) => {
					expect(result.statusCode).to.equal(200);
					expect(result.res.body.username).to.equal(user.username);
					expect(result.res.body).to.not.have.property('password');
					expect(result.res.body).to.not.have.property('salt');
					expect(result.res.body.email).to.equal(user.email);
				});
			});
		});

		describe('which does not exist', () => {
			it('returns 404', () => {
				return common.agents.anon.request('get', `/v1/users/${uuid()}`)
				.catch((result) => {
					expect(result.response.statusCode).to.equal(404);
				});
			});
		});
	});

	describe('getting the logged in user', () => {
		it('returns a user view', () => {
			return common.agents.default.request('get', '/v1/users/me')
			.then((result) => {
				expect(result.res.body.id).to.equal(common.agents.default.user.id);
			});
		});
	});

	describe('updating a user', () => {
		let user = {
			username : 'testUpdateUser',
			password : 'testUpdatePassword',
			email : 'testupdateemail@email.com'
		};
		let newEmail = 'testupdatedemail@email.net';

		describe('which exists', () => {
			after(() => {
				return common.deleteUser(user);
			});

			it('returns the new info', () => {
				return common.createAgent(user)
				.then((agent) => {
					return common.agentRequest(agent, 'put', `/v1/users/${agent.user.id}`, {
						email : newEmail
					});
				})
				.then((result) => {
					expect(result.res.body.email).to.equal(newEmail);
				});
			});
		});

		describe('as an admin', () => {
			after(() => {
				return common.deleteUser(user);
			});

			it('returns the new info', () => {
				return common.createAgent(user)
				.then((agent) => {
					return common.agents.admin.request('put', `/v1/users/${agent.user.id}`, {
						email : newEmail
					});
				})
				.then((result) => {
					expect(result.res.body.email).to.equal(newEmail);
				});
			});
		});

		describe('not owned by current user', () => {
			it('returns 403', () => {
				return common.agents.default.request('put', `/v1/users/${uuid()}`, {
					email : newEmail
				})
				.catch((result) => {
					expect(result.response.statusCode).to.equal(403);
				});
			});
		});

		describe('making the user an admin without admin rights', () => {
			after(() => {
				return common.deleteUser(user);
			});

			it('returns 403', () => {
				return common.createAgent(user)
				.then((agent) => {
					return common.agentRequest(agent, 'put', `/v1/users/${agent.user.id}`, {
						admin : true
					});
				})
				.then((result) => {
					console.log(result);
				})
				.catch((result) => {
					expect(result.response.statusCode).to.equal(403);
				});
			});
		});
	});

	describe('deleting a user', () => {
		let user = {
			username : 'testDeleteUser',
			password : 'testDeletePassword',
			email : 'testdeleteemail@email.com'
		};

		describe('which exists', () => {
			it('returns 204', () => {
				return common.createAgent(user)
				.then((agent) => {
					return common.agentRequest(agent, 'del', `/v1/users/${agent.user.id}`);
				})
				.then((result) => {
					expect(result.statusCode).to.equal(204);
				});
			});
		});

		describe('as an admin', () => {
			it('returns 204', () => {
				return common.createAgent(user)
				.then((agent) => {
					return common.agents.admin.request('del', `/v1/users/${agent.user.id}`);
				})
				.then((result) => {
					expect(result.statusCode).to.equal(204);
				});
			});
		})

		describe('not owned by current user', () => {
			it('returns 403', () => {
				return common.agents.default.request('del', `/v1/users/${uuid()}`)
				.catch((result) => {
					expect(result.response.statusCode).to.equal(403);
				});
			});
		});
	});

	describe('listing users', () => {
		describe('with no query', () => {
			it('returns a list of users', () => {
				return common.agents.anon.request('get', '/v1/users')
				.then((result) => {
					let hasDefaultUser = Boolean(_.find(result.res.body, (user) => {
						return user.id === common.agents.default.agent.user.id;
					}));

					expect(hasDefaultUser).to.be.true;

					let hasAdminUser = Boolean(_.find(result.res.body, (user) => {
						return user.id === common.agents.admin.agent.user.id;
					}));

					expect(hasAdminUser).to.be.true;
				});
			});
		});

		describe('with a query', () => {
			it('returns a subset of the list', () => {
				return common.agents.anon
					.request('get', `/v1/users?username=${common.agents.default.agent.user.username}`)
				.then((result) => {
					expect(result.res.body.length).to.equal(1);
					expect(result.res.body[0]).to.deep.equal(common.agents.default.agent.user);
				});
			});
		});
	});
});