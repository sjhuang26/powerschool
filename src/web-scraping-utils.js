const puppeteer = require('puppeteer');
const promptly = require('promptly');
const fileSystem = require('fs');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');

const puppeteerPreset = (fetchResult) => (async (...args) => 
  await fetchResult(puppeteer, promptly, ...args)
);

const ioPreset = (fetchResult) => ((outputDirectory) => (async (...args) => {
  rimraf.sync(outputDirectory);
  mkdirp.sync(outputDirectory);
  fileSystem.writeFile(outputDirectory + '/export.json', JSON.stringify(await fetchResult(outputDirectory, ...args)), err => {  
    if (err) throw err;
    console.log('Done!');
  });
}));

const loadBrowser = async (headless, width = 1500, height = 750, browserOptions = {}) => {
  console.log('Loading browser...');
  const browser = await puppeteer.launch({
    headless: headless,
    ...browserOptions
  });
  const page = await browser.newPage();
  await page.setViewport({
    width: width,
    height: height
  });
  return {
    browser: browser,
    page: page
  };
};

module.exports.puppeteerPreset = puppeteerPreset;
module.exports.ioPreset = ioPreset;
module.exports.loadBrowser = loadBrowser;