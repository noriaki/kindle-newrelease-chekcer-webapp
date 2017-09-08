const dig = require('object-dig');
const { OperationHelper } = require('apac');

const op = new OperationHelper({
  awsId: process.env.AWS_ID,
  awsSecret: process.env.AWS_SECRET,
  assocId: process.env.ASSOC_ID,
  maxRequestsPerSecond: 1,
  locale: 'JP',
  xml2jsOptions: { ignoreAttrs: true },
});

const reducer = (ret, item) => {
  const asin = item.ASIN;
  if (asin) {
    const authors = arrayify(dig(item, 'ItemAttributes', 'Author'));
    const creators = arrayify(dig(item, 'ItemAttributes', 'Creator'));
    const publishedAt = dig(item, 'ItemAttributes', 'PublicationDate');
    const releasedAt = dig(item, 'ItemAttributes', 'ReleaseDate');
    ret[asin] = {
      title: dig(item, 'ItemAttributes', 'Title'),
      description: dig(
        item, 'EditorialReviews', 'EditorialReview', 'Content'
      ),
      url: dig(item, 'DetailPageURL'),
      image: dig(item, 'LargeImage', 'URL'),
      authors: authors.concat(creators),
      publisher: dig(item, 'ItemAttributes', 'Publisher'),
      publishedAt: publishedAt ? new Date(publishedAt) : undefined,
      releasedAt: releasedAt ? new Date(releasedAt) : undefined,
    };
  }
  return ret;
};

const getBooks = async (asins, retry = 2) => {
  const ItemId = Array.isArray(asins) ? asins.join() : asins;
  const query = {
    ItemId, ResponseGroup: 'EditorialReview,Images,ItemAttributes',
  };
  const res = await op.execute('ItemLookup', query);
  const result = dig(res, 'result') || {};
  let items = dig(result, 'ItemLookupResponse', 'Items', 'Item');
  if (items) {
    if (!Array.isArray(items)) { items = [items]; }
  } else {
    const resError = dig(result, 'ItemLookupErrorResponse', 'Error');
    const reqError = dig(
      result, 'ItemLookupResponse', 'Items', 'Request', 'Errors', 'Error'
    );
    const error = resError || reqError;
    if (error) {
      console.error('Error (%s): %s', error.Code, error.Message);
      if (error.Code === 'RequestThrottled' && retry > 0) {
        await sleep(1000);
        return await getBooks(asins, retry - 1);
      } else if (error.Code === 'AWS.ECommerceService.ItemNotAccessible') {
        const asinArr = Array.isArray(asins) ? asins : asins.split(',');
        if (asinArr.length <= 1) { return {}; }
        const results = await Promise.all(asinArr.map(asin => getBooks(asin)));
        return results.reduce((ret, part) => ({ ...ret, ...part }), {});
      }
      return {};
    }
  }
  return (items || []).reduce(reducer, {});
};
module.exports = getBooks;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const arrayify = (array) => {
  if (array == null) { return []; }
  return Array.isArray(array) ? array : [array];
}
