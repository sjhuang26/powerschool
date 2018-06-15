const puppeteer = require('puppeteer');
const promptly = require('promptly');
const fileSystem = require('fs');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');

module.exports.preset = (fetchResult, outputDirectory) => (async (...args) => {
  rimraf.sync(outputDirectory);
  mkdirp.sync(outputDirectory);
  fileSystem.writeFile(outputDirectory + '/export.json', JSON.stringify(await fetchResult(puppeteer, promptly, outputDirectory, ...args)), err => {  
    if (err) throw err;
    console.log('Done!');
  });
});

module.exports.loadBrowser = async (headless, width = 1500, height = 750, browserOptions = {}) => {
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
