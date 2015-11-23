# PK (PsychoKinesis)

![pk](pk.png)

> A [PostgreSQL][postgres] / [Koa.js][koajs] server stack skeleton app

I wanted to play around with [Koa.js][koajs] because it's pretty neat, but I'm not such a hipster that I want to abandon SQL altogether. Since there seem to be minimal examples to draw on, here are some results from my own explorations.

## Areas of Note

### Code and Configuration

#### `src/config.js`

You're going to want to modify this with your own database information. There's `dev`, `test`, and `production` configs which are used when the corresponding `NODE_ENV` value is set.

#### `.editorconfig`

I'm not trying to enforce style here, this is just out of convenience for me. You might want to take a look and be sure it agrees with you.

#### `src/models/`

This is the folder where you'll drop your Sequelize model definitions. `PK` uses Sequelize's [import][import].

### Tests

Tests are fairly high-level and don't necessarily cover everything. There's some room for improvement.

#### `test/api/common.js`

This file contains a lot of tools for simulating user HTTP agents, using [Superagent][superagent]. It preloads two fixture users, a 'default' user and an 'admin' user. You can access them like so:

```javascript
let common = require('./common');

// returns a promise for a GET to '/' on the test server as a default user
common.agent.default.request('get', '/');

// returns a promise for a DELETE to '/users/someone' on the test server as an admin user
common.agent.admin.request('del', '/users/someone');
```

You can also create your own agent. Creating an agent also creates the user in the database, and logs them in:

```javascript
common.createAgent({
	username : 'foo',
	password : 'password1',
	email : 'foo@bar.com'
})
.then((agent) => {
	// see next sample for agent usage
});
```

Once you've created an agent for a new user, you can use the `agentRequest` function as a shortcut for making resolved requests to server endpoints (or just regular urls) using the agent.

```javascript
common.agentRequest(agent, 'put', '/v1/users/me', { email : 'mynewemail@place.com' });
```

When you're done with a user, be sure to clean it up.

```javascript
common.deleteUser(user); // where user is an object { username, password, email }, as above.
```

There's also a `dropUsers` function, but be careful with that. It will drop the built-in 'default' and 'admin' users too.

[postgres]: http://www.postgresql.org/
[koajs]: http://koajs.com/
[import]: http://docs.sequelizejs.com/en/latest/docs/models-definition/#import
[superagent]: https://github.com/visionmedia/superagent