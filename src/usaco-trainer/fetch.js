const Action = require('./../action');
const Schema = require('./../schema');

const fs = require('fs');

module.exports = new Action(async (session) => {
    const page = session.page;

    const options = await session.receiveOptions(inputSchemas);

    // LOAD WEBSITE
    session.sendLog('Loading website...');
    await page.goto('http://train.usaco.org/usacogate');

    // LOG IN
    session.sendLog('Logging in...');
    let query = 'body > table > tbody > tr:nth-child(1) > td:nth-child(2) > table > tbody > tr > td > div:nth-child(5) > center > form > table > tbody > tr:nth-child(1) > td:nth-child(2) > input[type="text"]';
    await page.type(query, options.username);
    query = 'body > table > tbody > tr:nth-child(1) > td:nth-child(2) > table > tbody > tr > td > div:nth-child(5) > center > form > table > tbody > tr:nth-child(2) > td:nth-child(2) > input[type="password"]';
    await page.type(query, options.password);
    query = 'body > table > tbody > tr:nth-child(1) > td:nth-child(2) > table > tbody > tr > td > div:nth-child(5) > center > form > input[type="submit"]:nth-child(2)';
    await Promise.all([
        page.click(query),
        page.waitForNavigation()
    ]);
    if (await page.evaluate(() => document.querySelector('body > table > tbody > tr:nth-child(1) > td:nth-child(2) > table > tbody > tr > td > div:nth-child(4) > p:nth-child(4) > font') !== null)) {
        // LOGIN ERROR
        session.sendError('LOGIN_FAILED');
        return;
    }

    // TAKE SCREENSHOT
    if (options.screenshots) {
        session.sendLog('Taking screenshot...');
        session.sendResource('MAIN_PAGE', await session.takeScreenshot({
            fullPage: 'true'
        }));
    }

    // GET ITEM LIST
    session.sendLog('Getting item list...');
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
    session.sendLog('| ###### ITEMS ######');
    session.sendLog('| Choose an option.');
    for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        session.sendLog(`| ${item.isProblem ? `(${i + 1})` : '   '} ${item.title}`);
    }
    let choice = (await session.receiveInput('ITEM_ID', inputSchemas)).item;

    // LOAD ITEM
    session.sendLog('Loading item...');
    await page.goto(items[choice - 1].link);

    // GENERATING ITEM
    session.sendLog('Generating item...');
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
    session.sendLog('Writing to file...');
    let resource = session.createResource('html');
    fs.writeFileSync(resource.path, itemHTML, (err) => {
        if (err) session.sendError(err);
    });
    session.sendResource('PROBLEM_HTML', resource);
});

const inputSchemas = {
    OPTIONS: new Schema(`
    username=string
    password=string
    screenshots=boolean?
    `),
    ITEM_ID: new Schema(`
    item=integer
    `)
};
