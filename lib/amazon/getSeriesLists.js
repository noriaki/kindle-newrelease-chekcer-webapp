const { URL, URLSearchParams } = require('url');
const puppeteer = require('puppeteer');

const getSeriesLists = async (categoryId) => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox'], headless: true, /* [DEBUG] headless: false */
  });
  const page = await browser.newPage();

  const seriesListId = categoryId;
  const seriesListName = categories[categoryId];
  const seriesListUrl = buildSeriesListUrl(seriesListId);
  await page.goto(seriesListUrl, { waitUntil: 'load' });
  const seriesLinks = await page.evaluate(seriesItemsExtractor);
  browser.close();
  return {
    id: seriesListId,
    name: seriesListName,
    items: seriesLinks.map(item => ({
      ...item, count: extractCountInParens(item.count),
    })),
  };
};
module.exports = getSeriesLists;

const seriesItemsExtractor = () => [
  ...document.querySelectorAll('.s-see-all-pagination-column .a-link-normal'),
].map(link => ({
  title: link.getAttribute('title'),
  count: link.querySelector('.narrowValue').textContent,
}));

const extractCountInParens = (narrowValue = '') => {
  const m = narrowValue.trim().match(/\((\d+)\)/);
  if (m && m.length === 2) { return parseInt(m[1], 10); }
  return null;
};

const buildSeriesListUrl = (categoryId) => {
  const baseUrl = 'https://www.amazon.co.jp/gp/search/other/';
  // Kindleストア, (Not) KindleカテゴリTOP / Kindle本 / コミック
  const ids = ['2250738051', '!2250739051', '2275256051', '2293143051'];
  const params = {
    rh: ids.concat(categoryId).map(id => `n:${id}`).join(),
    pickerToList: 'lbr_books_series_browse-bin',
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

getSeriesLists.buildSeriesListUrl = buildSeriesListUrl;
getSeriesLists.categories = categories;
