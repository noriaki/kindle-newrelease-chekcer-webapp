const { URL, URLSearchParams } = require('url');
const getPageInstance = require('../crawler');

const getBundleLists = async (categoryId, pageInstance) => {
  const page = pageInstance ? pageInstance : await getPageInstance();

  const categoryName = categories[categoryId];

  let pageNo = 1;
  let hasNextPageLink = true;
  let asins = [];
  while (hasNextPageLink) {
    const bundleListUrl = buildBundleListUrl(categoryId, pageNo);
    await page.goto(bundleListUrl, { waitUntil: 'load' });
    asins = [...asins, ...await page.evaluate(booksAsinExtractor)];
    hasNextPageLink = Boolean(await page.$('#pagnNextLink'));
    // console.log({ pageNo, asinsSize: asins.length, hasNextPageLink });
    pageNo += 1;
  }
  if (!pageInstance) { page.finally(); }
  return {
    id: categoryId,
    name: categoryName,
    asins,
  };
};
module.exports = getBundleLists;

const booksAsinExtractor = () => [
  ...document.querySelectorAll('.s-result-item[data-asin]'),
].map(li => li.getAttribute('data-asin'));

const buildBundleListUrl = (categoryId, page = 1) => {
  const baseUrl = 'https://www.amazon.co.jp/gp/search/';
  const ids = [
    '2250738051', // Kindleストア
    '!2250740051',
    '!2275262051',
    '4160318051', // Kindleコミックまとめ買い
    '2275256051', // Kindle本
    '2293143051', // コミック
  ];
  const params = {
    rh: ids.concat(categoryId).map(id => `n:${id}`).join(),
    bbn: '4160318051',
    sort: 'date-desc-rank',
    lo: 'digital-text',
    page,
  };
  const url = new URL(baseUrl);
  url.search = new URLSearchParams(params);
  return url.toString();
};

const categories = {
  '2430812051': '少年コミック',
  '2430869051': '青年コミック',
  '2430765051': '少女コミック',
  '2430737051': '女性コミック',
};

getBundleLists.buildBundleListUrl = buildBundleListUrl;
getBundleLists.categories = categories;
