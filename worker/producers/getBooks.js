const Book = require('../../db/models/book');
const promiseErrorHandler = require('../../lib/promiseErrorHandler');
const sleep = require('../../lib/utils/sleep');
const exchange = require('../amqp')();

const key = 'books.detail.get';

(async () => {
  while (await Book.whereNeedsUpdate().count() > 0) {
    const books = await Book.entriesNeedsUpdate().exec();
    const asins = books.map(book => book.id);
    console.log(
      'Processing to [%s] %s..%s',
      key, asins[0], asins[asins.length - 1]
    );
    exchange.publish({ asins }, { key });
  }
  await sleep(1000);
})().then(() => process.exit(0)).catch(promiseErrorHandler);

process.on('unhandledRejection', promiseErrorHandler);
