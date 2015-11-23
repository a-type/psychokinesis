'use strict';
let development = {
	host : 'http://localhost',
	port : 8080,

	session : {
		secret : 'development-secret'
	},

	db : {
		name : 'pk',
		username : process.env.DB_USER,
		password : process.env.DB_PASS,
		host : 'localhost',
		dialect : 'postgres'
	},

	google : {
		clientId : 'TODO',
		clientSecret : 'TODO'
	},

	facebook : {
		clientId : 'TODO',
		clientSecret : 'TODO'
	}
};

let production = {

};

let test = {
	host : 'http://localhost',
	port : 8081,

	session : {
		secret : 'test-secret'
	},

	db : {
		name : 'pk-test',
		username : process.env.DB_USER,
		password : process.env.DB_PASS,
		host : 'localhost',
		dialect : 'postgres'
	},

	google : {
		clientId : 'FAKE',
		clientSecret : 'FAKE'
	},

	facebook : {
		clientId : 'FAKE',
		clientSecret : 'FAKE'
	}
};

console.log(`starting in ${process.env.NODE_ENV || 'development'} environment`);
if (process.env.NODE_ENV === 'production') {
	module.exports = production;
}
else if (process.env.NODE_ENV === 'test') {
	module.exports = test;
}
else {
	module.exports = development;
}

module.exports.serverUrl = `${module.exports.host}${module.exports.port ? ':' + module.exports.port : ''}`;