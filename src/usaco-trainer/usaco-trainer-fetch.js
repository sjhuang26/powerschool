const utils = require('../web-scraping-utils');
const fs = require('fs');
const opn = require('opn');

const query = async (puppeteer, promptly, outputDirectory, username, password, screenshots, headless) => {
  // INIT
  if (username === undefined) {
    username = await promptly.prompt('Username: ');
  }
  if (password === undefined) {
    password = await promptly.password('Password: ');
  }

  const {browser, page} = await utils.loadBrowser(headless);

  // LOAD WEBSITE
  console.log('Loading website...');
  await page.goto('http://train.usaco.org/usacogate');

  // LOG IN
  console.log("Logging in...");
  let query = 'body > table > tbody > tr:nth-child(1) > td:nth-child(2) > table > tbody > tr > td > div:nth-child(4) > center > form > table > tbody > tr:nth-child(1) > td:nth-child(2) > input[type="text"]';
  await page.type(query, username);
  query = 'body > table > tbody > tr:nth-child(1) > td:nth-child(2) > table > tbody > tr > td > div:nth-child(4) > center > form > table > tbody > tr:nth-child(2) > td:nth-child(2) > input[type="password"]';
  await page.type(query, password);
  query = 'body > table > tbody > tr:nth-child(1) > td:nth-child(2) > table > tbody > tr > td > div:nth-child(4) > center > form > input[type="submit"]:nth-child(2)';
  await Promise.all([
    page.click(query),
    page.waitForNavigation()
  ]);
  if (await page.evaluate(() => document.querySelector('body > table > tbody > tr:nth-child(1) > td:nth-child(2) > table > tbody > tr > td > div:nth-child(4) > p:nth-child(4) > font') !== null)) {
    // LOGIN ERROR
    console.log('[ERROR] Login failed.');
    browser.close();
    return {};
  }

  // TAKE SCREENSHOT
  if (screenshots) {
    console.log('Taking screenshot...');
    await page.screenshot({
      path: outputDirectory + '/screenshot-main-page.png',
      fullPage: 'true'
    });
  }

  // GET ITEM LIST
  console.log('Getting item list...');
  let items = await page.evaluate(() => {
    let items = [];
    for (const e of document.querySelectorAll('body > center:nth-child(6) > table > tbody > tr > td:nth-child(3) > table > tbody > tr')) {
      if (e.bgColor === '#f8f8ff') {
        let item = {};
        item.title = e.querySelector(':last-child > a').innerText;
        item.link = e.querySelector(':last-child > a').href;
        item.isProblem = item.title.startsWith('PROB');
        items.push(item);
      }
    }
    return items;
  });

  // DISPLAY ITEM LIST
  console.log('| ###### ITEMS ######');
  console.log('| Choose an option.');
  for (let i = 0; i < items.length; ++i) {
    const item = items[i];
    console.log(`| ${item.isProblem ? `(${i + 1})` : '   '} ${item.title}`);
  }
  let choice = await promptly.prompt('| :');

  // LOAD ITEM
  console.log('Loading item...')
  await page.goto(items[choice - 1].link);

  // GENERATING ITEM
  console.log('Generating item...');
  let itemHTML = await page.evaluate((() => {
    document.body.removeAttribute('background');
    document.querySelector('body > img').remove();
    document.querySelector('head').insertAdjacentHTML('beforeend', `
    <style>
    body {
      /* This is Medium.com's text styling. */
      font-family: medium-content-serif-font,Georgia,Cambria,"Times New Roman",Times,serif;
      font-size: 21px;
      font-style: normal;
      font-weight: 400;
      letter-spacing: -0.063px;
      line-height: 33.18px;
      text-rendering: optimizeLegibility;
      text-size-adjust: 100%;
      word-break: break-word;
      word-wrap: break-word;
      -webkit-font-smoothing: antialiased;
      opacity: 0.84;
      margin: 50px auto;
      max-width: 800px;
    }
    </style>
    `);
    document.querySelector('head').insertAdjacentHTML('afterbegin', `
    <base href="http://train.usaco.org">
    `);
    return document.querySelector('html').outerHTML;
  }));

  // WRITE TO FILE
  console.log('Writing to file...');
  let filePath = outputDirectory + '/item.html';
  fs.writeFileSync(filePath, itemHTML, (err) => {
    if (err) console.log(err);
  });

  // OPEN
  console.log('Opening file...');
  opn(filePath);

  // WRAP UP
  browser.close();
  return {};
};

module.exports = utils.ioPreset(query, 'output/calnewport/blog');
