const getBundles = require('../../lib/amazon/getBundles');
const Series = require('../../db/models/series');
const exchange = require('../amqp')();

const options = { name: 'bundles.detail.get', durable: true };
const handler = ({ asins }, ack) => {
  (async () => {
    await Series.updateStatusManyToProcessing(asins);
    const details = await getBundles(asins);
    if (!details.error) {
      await Promise.all(
        asins.map(asin => Series.createOrUpdateByPAAPI(asin, details[asin]))
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
