const Action = require('./../action');
const Schema = require('./../schema');

module.exports = new Action(async (session) => {
	const {page} = session;

	// LOAD WEBSITE
	session.sendLog('Loading website...');
	await page.goto('https://artofproblemsolving.com');

	// SCRAPE MAIN PAGE
	session.sendLog('Scraping main page...');
	let result = await page.evaluate(() => {
		const dataTokens = document.querySelector('#community-panel > div.community-top-content > div.cmty-whois > div:nth-child(2)').textContent.match(/\S+/g).filter(a => /^\d+$/.test(a));
		result = {
			onlineUsers: {
				count: parseInt(dataTokens[0]),
				registeredCount: parseInt(dataTokens[1]),
				registeredHiddenCount: parseInt(dataTokens[2]),
				registeredShown: document.querySelector('#community-panel > div.community-top-content > div.cmty-whois > div.cmty-whois-users').textContent.substring('Registered users online: '.length).split(',').map(x => x.trim())
			}
		};
		return result;
	});
	session.sendResult('RESULT', result, outputSchemas);
});

const outputSchemas = {
	RESULT: new Schema(`
    onlineUsers count: registeredCount: registeredHiddenCount:
    onlineUsers registeredShown[] =string
    `)
};

module.exports.outputSchemas = outputSchemas;
