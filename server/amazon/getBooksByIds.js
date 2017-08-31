const dig = require('object-dig');
const { OperationHelper } = require('apac');

const op = new OperationHelper({
  awsId: process.env.AWS_ID,
  awsSecret: process.env.AWS_SECRET,
  assocId: process.env.ASSOC_ID,
  maxRequestsPerSecond: 1,
  locale: 'JP',
});

const reducer = (ret, item) => {
  const asin = item.ASIN;
  if (asin) {
    const authors = dig(item, 'ItemAttributes', 'Author')
    const publishedAt = dig(item, 'ItemAttributes', 'PublicationDate');
    const releasedAt = dig(item, 'ItemAttributes', 'ReleaseDate');
    ret[asin] = {
      title: dig(item, 'ItemAttributes', 'Title'),
      description: dig(
        item, 'EditorialReviews', 'EditorialReview', 'Content'
      ),
      url: dig(item, 'DetailPageURL'),
      image: dig(item, 'LargeImage', 'URL'),
      authors: Array.isArray(authors) ? authors : [authors],
      publisher: dig(item, 'ItemAttributes', 'Publisher'),
      publishedAt: publishedAt ? new Date(publishedAt) : undefined,
      releasedAt: releasedAt ? new Date(releasedAt) : undefined,
    };
  }
  return ret;
};

const getBooksByIds = async (asins, retry = 2) => {
  const ItemId = Array.isArray(asins) ? asins.join() : asins;
  const query = {
    ItemId,
    ResponseGroup: 'EditorialReview,Images,ItemAttributes',
  };
  const res = await op.execute('ItemLookup', query);
  let items = dig(res, 'result', 'ItemLookupResponse', 'Items', 'Item');
  if (!Array.isArray(items)) { items = [items]; }
  const err = dig(res, 'result', 'ItemLookupErrorResponse', 'Error', 'Code');
  if (items === undefined && err === 'RequestThrottled') {
    if (retry > 0) {
      await sleep(1000);
      return getBooksByIds(asins, retry - 1);
    }
  }
  return (items || []).reduce(reducer, {});
};
module.exports = getBooksByIds;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
