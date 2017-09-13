const throng = require('throng');

const createExchange = require('./amqp');
const getPurchasedBooksConsumer = require('./consumers/getPurchasedBooks');
const getBooksConsumer = require('./consumers/getBooks');
const getBundlesConsumer = require('./consumers/getBundles');
const consumers = {
  getPurchasedBooksConsumer,
  getBooksConsumer,
  getBundlesConsumer,
};

throng({ workers: 1 }, () => {
  const shutdown = () => {
    console.log('> Shutting worker down');
    process.exit();
  }
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  const exchange = createExchange();
  for (const consumer of Object.values(consumers)) {
    exchange
      .queue(consumer.options)
      .consume(consumer.handler);
  }

  const consumerNameList = Object.keys(consumers).map(name => `  - ${name}`);
  console.log(`> Ready on worker...\n${consumerNameList.join('\n')}\n`);
});
