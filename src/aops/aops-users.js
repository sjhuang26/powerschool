const utils= require('../web-scraping-utils');

module.exports = utils.preset(async (puppeteer, promptly, headless) => {
  const {browser, page} = await utils.loadBrowser(headless);

  // LOAD WEBSITE
  console.log('Loading website...');
  await page.goto('https://powerschool3.niskyschools.org/public/');
}, 'output/powerschool');
