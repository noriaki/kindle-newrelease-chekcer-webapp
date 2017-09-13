const getBooks = require('../../lib/amazon/getBooks');
const Book = require('../../db/models/book');
const exchange = require('../amqp')();

const options = { name: 'books.detail.get', durable: true };
const handler = ({ asins }, ack) => {
  (async () => {
    await Book.updateStatusManyToProcessing(asins);
    const details = await getBooks(asins);
    if (!details.error) {
      await Promise.all(
        asins.map(asin => Book.createOrUpdateByPAAPI(asin, details[asin]))
      );
      console.log(
        'Pull from [%s] %s..%s',
        options.name, asins[0], asins[asins.length - 1]
      );
    } else if (details.error === 'RequestThrottled') {
      console.log(
        'Retry to [%s] %s..%s',
        options.name, asins[0], asins[asins.length - 1]
      );
      exchange.publish({ asins }, { key: options.name });
    }
    ack();
  })();
};

module.exports = { options, handler };

process.on('unhandledRejection', console.dir);
