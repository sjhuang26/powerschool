const Action = require('./../action');

module.exports = new Action('', async (session, options) => {
    const page = session.page;

    // LOAD WEBSITE
    session.sendLog('Loading website...');
    await page.goto('http://calnewport.com/blog/');

    // SCRAPE MAIN PAGE
    session.sendLog('Scraping main page...');
    let result = {};
    const links = await page.evaluate(() => {
        const links = [];
        for (const e of document.querySelectorAll('body > div.owrap > div > div.main.content.blog > article > p > a.more-link')) {
            links.push(e.href);
        }
        return links;
    });

    // SCRAPE BLOG PAGES
    session.sendLog('Scraping blog pages (' + links.length + ')...');
    result.recentPosts = [];
    for (let i = 0; i < links.length; ++i) {
        session.sendLog('    scraping page ' + (i + 1) + ' of ' + links.length + '...');
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

    session.sendOutput('RESULT', result);
});
