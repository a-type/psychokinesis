'use strict';

/*
	This service loads models from the ../models folder
	For more info on how to define a model, see
	http://docs.sequelizejs.com/en/latest/docs/models-definition/#import
*/

const Sequelize = require('sequelize');
const fs = require('fs');
const log = require('../util/log');
const _ = require('lodash');
const path = require('path');

const config = require('../config');
log.info(`connecting to db: ${config.db.name}`);

let sequelize = new Sequelize(
	config.db.name,
	config.db.username,
	config.db.password,
	{
		host : config.db.host,
		dialect : config.db.dialect,
		logging : log.quiet
	}
);

let models = {};

var files = fs.readdirSync(path.join(__dirname, '..', 'models'));

files.forEach((file) => {
	try {
		let fileType = file.split('.')[1];
		if (!fileType || fileType.toLowerCase() !== 'js') {
			return;
		}

		let model = sequelize.import(path.join(__dirname, '..', 'models', file));
		log.info(`imported model: ${model.name}`);
		models[model.name] = model;
	} catch (e) {
		log.error(e.stack);
	}
});

_.keys(models).forEach((modelName) => {
	if ('associate' in models[modelName]) {
		models[modelName].associate(models);
	}
});

models.client = sequelize;

module.exports = models;
