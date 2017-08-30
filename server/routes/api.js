const jwt = require('jsonwebtoken');
const uuid = require('uuid/v4');
const routes = require('express').Router();
const { sendJSON } = require('next/dist/server/render');

routes.get('/user', (req, res) => {
  const message = '/test05';
  sendJSON(res, { message });
});

routes.post('/user', (req, res) => (
  sendJSON(res, { user: createUser() })
));

routes.post('/session', (req, res) => {
  const user = createUser();
  const token = createToken(user);
  sendJSON(res, { user, token });
});

module.exports = routes;

const createUser = () => ({
  identifier: uuid(),
});

const createToken = user => jwt.sign(
  user, process.env.SECRET_KEY_BASE, { expiresIn: '10y' }
);
