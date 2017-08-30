const jwt = require('jsonwebtoken');
const uuid = require('uuid/v4');
const routes = require('express').Router();
const { sendJSON } = require('next/dist/server/render');

const { createConnection } = require('../db');
const { userSchema } = require('../db/models/user');
const { bookSchema } = require('../db/models/book');

const connection = createConnection();
const User = connection.model('User', userSchema);
const Book = connection.model('Book', bookSchema);

const cert = process.env.SECRET_KEY_BASE;

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

routes.use((req, res, next) => {
  if (!req.token) {
    return res.status(403).json({
      success: false,
      message: 'No token provided.',
    });
  }

  try {
    req.user = getUserFromToken(req.token);
  } catch (err) {
    return res.json({
      success: false,
      message: 'Invalid token',
    })
  }

  next();
});

routes.post('/books', async (req, res) => {
  const { identifier } = req.user;
  const { asins } = req.body;
  await User.findOneAndUpdate({ identifier }, { asins });
  for (const asin of asins) {
    await Book.findOneAndUpdate({ asin }, { asin }, { upsert: true });
  }
  sendJSON(res, { success: true });
});

module.exports = routes;

const createUser = () => ({
  identifier: uuid(),
});

const createToken = user => jwt.sign(user, cert, { expiresIn: '10y' });

const getUserFromToken = token => jwt.verify(token, cert);
