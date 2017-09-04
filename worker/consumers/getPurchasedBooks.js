const jwt = require('jsonwebtoken');

const getPurchasedBooks = require('../../lib/amazon/getPurchasedBooks');
const User = require('../../db/models/user');
const cert = process.env.SECRET_KEY_BASE;

const options = { name: 'books.purchased.get', durable: true };
const handler = ({ dataToken }, ack) => {
  (async () => {
    const { identifier, aid, apw } = jwt.verify(dataToken, cert);
    const user = await User.findOne({ identifier });
    const books = await getPurchasedBooks(aid, apw);
    await user.createBooksPurchased(books);
    ack();
  })();
};

module.exports = { options, handler };
