/* global describe, after, it, before */

'use strict';
const common = require('./common');
const expect = require('chai').expect;
const request = require('superagent');

describe('authenticating', () => {
	describe('locally', () => {
		let user = {
			username : 'authTestUser',
			password : 'authTestPassword',
			email : 'authtest@email.com'
		};

		describe('with json', () => {
			after(() => {
				return common.deleteUser(user);
			});

			it('sets a cookie', () => {
				return common.agents.anon.request('post', '/v1/users', user)
				.then(() => {
					return request.post(common.resolvePath('/v1/auth/local/login'))
					.send({
						username : user.username,
						password : user.password
					});
				})
				.then((response) => {
					expect(response.headers[ 'set-cookie' ][0]).to.contain('koa:sess=');
				});
			});
		});

		describe('with form-encoded', () => {
			after(() => {
				return common.deleteUser(user);
			});

			it('sets a cookie', () => {
				return common.agents.anon.request('post', '/v1/users', user)
				.then(() => {
					return request.post(common.resolvePath('/v1/auth/local/login'))
					.type('form')
					.send({
						username : user.username,
						password : user.password
					});
				})
				.then((response) => {
					expect(response.headers[ 'set-cookie' ][0]).to.contain('koa:sess=');
				});
			});
		});
	});
});