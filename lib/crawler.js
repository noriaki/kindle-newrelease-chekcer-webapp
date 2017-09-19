const puppeteer = require('puppeteer');
const defaultsDeep = require('lodash.defaultsdeep');

let pageInstance;
let instanceCount = 1;

const getCrawlerInstance = async (opts = {}) => {
  const options = defaultsDeep(opts, {
    force: false,
    debug: false,
    browserOpts: {
      args: ['--no-sandbox'], headless: true, /* [DEBUG] headless: false */
    },
  });

  if (pageInstance) {
    if (!options.fouce) {
      return pageInstance;
    }
    finalize();
  }

  if (options.debug) {
    options.browserOpts.headless = false;
  }

  const browser = await puppeteer.launch(options.browserOpts);
  pageInstance = await browser.newPage();

  pageInstance.getBrowser = () => browser;
  pageInstance.closeBrowser = () => browser.close();
  pageInstance.finally = () => {
    instanceCount -= 1;
    if (instanceCount === 0) { finalize(); }
  };
  instanceCount += 1;
  return pageInstance;
};
module.exports = getCrawlerInstance;

const finalize = () => {
  if (pageInstance) {
    pageInstance.closeBrowser();
    pageInstance = undefined;
  }
};
