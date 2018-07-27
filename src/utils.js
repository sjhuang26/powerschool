const puppeteer = require('puppeteer');

const ID_LENGTH = 5;
const ID_CHARS = '1234567890abcdef';

async function startBrowser(browserOptions) {
    const browser = await puppeteer.launch({
        ...browserOptions
    });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1500,
        height: 750
    });
    return {
        browser: browser,
        page: page,
        puppeteer: puppeteer
    };
}

function createID() {
    const currentTime = String(new Date().getTime()).padStart(16, '0');
    let id = currentTime + '-';
    for (let i = 0; i < ID_LENGTH; i++) {
        id += ID_CHARS.charAt(Math.floor(Math.random() * ID_CHARS.length));
    }
    return id;
}

module.exports.startBrowser = startBrowser;
module.exports.createID = createID;
