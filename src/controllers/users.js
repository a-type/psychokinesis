'use strict';
const compose = require('koa-compose');
const users = require('../services/users');
const log = require('../util/log');
const _ = require('lodash');
const Joi = require('joi');

function * createUser () {
	let body = this.request.body;
	let result = Joi.validate(body, users.model.CREATE_SCHEMA);

	if (result.error) {
		this.status = 400;
		this.body = { error : result.error.message };
		return;
	}

	let user = yield users.create(body);
	this.body = users.view(user);
}

function * getUser () {
	if (this.params.id === 'me') {
		if (this.req.user) {
			this.body = users.view(this.req.user);
			return;
		}
	}

	let user = yield users.get(this.params.id);
	if (!user) {
		this.throw(new Error('no user exists for this id'), 404);
	}
	else {
		this.body = users.view(user);
	}
}

function * deleteUser () {
	if (this.req.user.id !== this.params.id && !this.req.user.admin) {
		this.throw(new Error('you are not authorized to delete this user'), 403);
	}

	yield users.delete(this.params.id);
	this.status = 204;
}

function * listUsers () {
	let query = this.request.query;
	let result = Joi.validate(query, users.model.LIST_QUERY_SCHEMA);

	if (result.error) {
		this.throw(result.error, 400);
		return;
	}

	var userList;
	userList = yield users.list(query);

	this.body = _.map(userList, users.view);
}

function * updateUser () {
	let body = this.request.body;
	let result = Joi.validate(body, users.model.UPDATE_SCHEMA);

	if (result.error) {
		this.throw(result.error, 400);
		return;
	}

	if (this.req.user.id !== this.params.id && !this.req.user.admin) {
		this.throw(new Error('you are not authorized to edit this user'), 403);
	}

	if (body.admin && !this.req.user.admin) {
		this.throw(new Error('you are not authorized to make this user an admin'), 403);
	}

	let updated = yield users.update(this.params.id, body);
	this.body = users.view(updated);
}

module.exports = {
	create : createUser,
	get : getUser,
	update : updateUser,
	del : deleteUser,
	list : listUsers
};