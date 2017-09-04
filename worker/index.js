const throng = require('throng');

const createExchange = require('./amqp');
const getPurchasedBooksConsumer = require('./consumers/getPurchasedBooks');
const consumers = {
  getPurchasedBooksConsumer,
};

throng({ workers: 1 }, () => {
  const shutdown = () => {
    console.log('shutting down');
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

  console.log(`> Ready on worker (${Object.keys(consumers).join(', ')})`);
});
