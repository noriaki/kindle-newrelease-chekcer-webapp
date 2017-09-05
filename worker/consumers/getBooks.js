const getBooks = require('../../lib/amazon/getBooks');
const Book = require('../../db/models/book');

const options = { name: 'books.detail.get', durable: true };
const handler = ({ asins }, ack) => {
  (async () => {
    const details = await getBooks(asins);
    for (const asin of asins) {
      const attributes = details[asin];
      await Book.findOneAndUpdate({ asin }, {
        ...(attributes || {}), active: Boolean(attributes), processing: false,
      });
    }
    console.log(
      'Processed from [%s] %s..%s',
      options.name, asins[0], asins[asins.length - 1]
    );
    ack();
  })();
};

module.exports = { options, handler };

process.on('unhandledRejection', console.dir);
