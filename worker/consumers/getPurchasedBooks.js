const jwt = require('jsonwebtoken');

const getPurchasedBooks = require('../../lib/amazon/getPurchasedBooks');

const { createConnection } = require('../../db');
const { userSchema } = require('../../db/models/user');
const { bookSchema } = require('../../db/models/book');

const connection = createConnection();
const User = connection.model('User', userSchema);
const Book = connection.model('Book', bookSchema);

const cert = process.env.SECRET_KEY_BASE;

const options = { name: 'books.purchased.get', durable: true };

const handler = ({ dataToken }, ack) => {
  (async () => {
    const { identifier, aid, apw } = jwt.verify(dataToken, cert);
    // const books = await getPurchasedBooks(aid, apw);
    console.log({ identifier, aid, apw });
    ack();
  })();
};

module.exports = { options, handler };
