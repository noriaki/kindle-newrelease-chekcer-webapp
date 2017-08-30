const jwt = require('jsonwebtoken');
const uuid = require('uuid/v4');
const routes = require('express').Router();
const { sendJSON } = require('next/dist/server/render');

const { createConnection } = require('../db');
const { userSchema } = require('../db/models/user');

const connection = createConnection();
const User = connection.model('User', userSchema);

routes.get('/user', (req, res) => {
  const message = '/test05';
  sendJSON(res, { message });
});

routes.post('/user', (req, res) => (
  sendJSON(res, { user: createUser() })
));

routes.post('/session', async (req, res) => {
  const { identifier } = req.body;
  const query = identifier == null ? createUser() : { identifier };
  const { user } = await User.firstOrCreate(query);
  const token = createToken({ identifier: user.identifier });
  sendJSON(res, { user, token });
});

module.exports = routes;

const createUser = () => ({
  identifier: uuid(),
});

const createToken = user => jwt.sign(
  user, process.env.SECRET_KEY_BASE, { expiresIn: '10y' }
);
