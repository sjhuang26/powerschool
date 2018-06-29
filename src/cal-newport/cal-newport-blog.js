const utils = require('../web-scraping-utils');

const query = async (puppeteer, promptly, outputDirectory, headless) => {
  const {browser, page} = await utils.loadBrowser(headless);

  // LOAD WEBSITE
  console.log('Loading website...');
  await page.goto('http://calnewport.com/blog/');

  // SCRAPE MAIN PAGE
  console.log('Scraping main page...');
  let result = {};
  const links = await page.evaluate(() => {
    links = [];
    for (const e of document.querySelectorAll('body > div.owrap > div > div.main.content.blog > article > p > a.more-link')) {
      links.push(e.href);
    }
    return links;
  });

  // SCRAPE BLOG PAGES
  console.log('Scraping blog pages (' + links.length + ')...');
  result.recentPosts = [];
  for (let i = 0; i < links.length; ++i) {
    console.log('    scraping page ' + (i + 1) + ' of ' + links.length + '...');
    const link = links[i];
    await page.goto(link);
    let post = await page.evaluate(() => {
      let post = {};
      post.title = document.querySelector('body > div.owrap > div > div.main.content.blog > article > h1').textContent;
      let $article = document.querySelector('body > div.owrap > div > div.main.content.blog > article');
      let start = false, content = '', htmlContent = '';
      for (let i = 0; i < $article.childNodes.length; ++i){
        const e = $article.childNodes[i];
        if (start) {
          if (e.id === 'comments') break;
          let a = e.innerText;
          let b = e.nodeValue;
          let c = ((typeof a === 'string') ? a.trim() : '') + ((typeof b === 'string') ? b.trim() : '');
          if (c !== '') content += c + '\n';
          if (typeof b === 'string') htmlContent += b.trim(); else htmlContent += e.outerHTML.trim();
        } else if (e.nodeName === 'SMALL') start = true;
      }
      post.htmlContent = htmlContent;
      post.content = content;
      return post;
    });
    post.link = link;
    result.recentPosts.push(post);
  }

  // WRAP UP
  browser.close();
  return result;
};

module.exports = utils.ioPreset(query, 'output/calnewport/blog');
