'use strict';
var crypto = require('crypto');
var Joi = require('joi');
var Bluebird = require('bluebird');
var config = require('../config');

var pbkdf2 = Bluebird.promisify(crypto.pbkdf2);
var randomBytes = Bluebird.promisify(crypto.randomBytes);

Bluebird.promisifyAll(Joi);

var PASSWORD_LENGTH_MIN = 8;
var USERNAME_LENGTH_MIN = 3;
var USERNAME_LENGTH_MAX = 30;

var USERNAME_REGEX = new RegExp(`^\\w[\\w-]{${USERNAME_LENGTH_MIN},${USERNAME_LENGTH_MAX}}$`);
var EMAIL_REGEX = /^([\w_\.\-\+])+\@([\w\-]+\.)+([\w]{2,10})+$/;
var PASSWORD_REGEX = new RegExp(`^.{${PASSWORD_LENGTH_MIN},}`);

const CREATE_SCHEMA = Joi.object().keys({
	username : Joi.string().required().regex(USERNAME_REGEX),
	password : Joi.string().required().regex(PASSWORD_REGEX),
	email : Joi.string().required().regex(EMAIL_REGEX)
});

const LIST_QUERY_SCHEMA = Joi.object().keys({
	username : Joi.string().optional(),
	email : Joi.string().optional(),
	admin : Joi.boolean().optional()
});

const UPDATE_SCHEMA = Joi.object().keys({
	username : Joi.string().optional().regex(USERNAME_REGEX),
	password : Joi.string().optional().regex(PASSWORD_REGEX),
	avatar : Joi.any().optional(),
	admin : Joi.boolean().optional(),
	email : Joi.string().email().optional()
});

module.exports = function (sequelize, DataTypes) {
	const User = sequelize.define("User", {
		id : {
			type : DataTypes.UUID,
			defaultValue : DataTypes.UUIDV4,
			primaryKey : true,
			allowNull : false,
			unique : true
		},

		username : {
			type : DataTypes.STRING(USERNAME_LENGTH_MAX),
			unique : true,
			allowNull : false,
			validate : {
				is : USERNAME_REGEX,
				notEmpty : true,
				len : [USERNAME_LENGTH_MIN, USERNAME_LENGTH_MAX]
			}
		},

		email : {
			type : DataTypes.STRING(256),
			unique : true,
			allowNull : false,
			validate : {
				is : EMAIL_REGEX,
				isEmail : true,
				isLowercase : true,
				notEmpty : true,
				len : [5, 256]
			}
		},

		passwordHash : {
			type : DataTypes.STRING(64),
			allowNull : false,
			field : 'password_hash'
		},

		salt : {
			type : DataTypes.STRING(32),
			allowNull : false
		},

		admin : {
			type : DataTypes.BOOLEAN,
			defaultValue : false,
			allowNull : false
		},

		avatarUrl : {
			type : DataTypes.STRING,
			field : 'avatar_url'
		}
	}, {
		tableName : 'users',
		underscored : true,

		name : {
			singular : 'user',
			plural : 'users'
		},

		indexes : [ {
			unique : true,
			fields : [ 'email', 'username' ]
		} ],

		classMethods : {
			associate (models) {

			},

			salt () {
				return randomBytes(16).then((buf) => {
					return buf.toString('hex');
				});
			},

			hash (password, salt) {
				return pbkdf2(password, salt, 64000, 32, 'sha256').then((buf) => {
					return buf.toString('hex');
				});
			},

			verify (hash, password, salt) {
				return pbkdf2(password, salt, 64000, 32, 'sha256').then((buf) => {
					return hash === buf.toString('hex');
				});
			},

			get USERNAME_REGEX () {
				return USERNAME_REGEX;
			},

			get EMAIL_REGEX () {
				return EMAIL_REGEX;
			},

			get PASSWORD_REGEX () {
				return PASSWORD_REGEX;
			},

			get PASSWORD_LENGTH_MIN () {
				return PASSWORD_LENGTH_MIN;
			},

			get USERNAME_LENGTH_MIN () {
				return USERNAME_LENGTH_MIN;
			},

			get USERNAME_LENGTH_MAX () {
				return USERNAME_LENGTH_MAX;
			},

			get CREATE_SCHEMA () {
				return CREATE_SCHEMA;
			},

			get UPDATE_SCHEMA () {
				return UPDATE_SCHEMA
			},

			get LIST_QUERY_SCHEMA () {
				return LIST_QUERY_SCHEMA;
			}
		},

		instanceMethods : {
			url () {
				var id = this.id;
				return `${config.host}${config.port ? ':' + config.port : ''}/v1/users/${id}`;
			}
		},

		hooks : {

		}
	});

	return User;
};