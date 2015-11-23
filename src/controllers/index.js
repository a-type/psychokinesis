'use strict';
const Router = require('koa-router');

let controllers = {
	auth : require('./auth'),
	users : require('./users')
};

let apiRouter = new Router({ prefix : '/v1' });

apiRouter.post('/auth/local/login', controllers.auth.local.login);
apiRouter.post('/auth/local/logout', controllers.auth.local.logout);

apiRouter.get('/users', controllers.users.list);
apiRouter.post('/users', controllers.users.create);
apiRouter.get('/users/:id', controllers.users.get);

// all routes below this one will require auth
apiRouter.all(':path(.*)', function * (next) {
	if (this.isAuthenticated()) {
		yield next;
	}
	else {
		this.body = { error : 'please log in to use this api' };
		this.status = 401;
	}
});

apiRouter.put('/users/:id', controllers.users.update);
apiRouter.delete('/users/:id', controllers.users.del);

module.exports = apiRouter;