const Action = require('./../action');
const Schema = require('./../schema');

module.exports = new Action(async (session) => {
	const page = session.page;

	const options = await session.getOptionsInput(inputSchemas);

	// LOAD WEBSITE
	session.sendLog('Loading website...');
	await page.goto('https://powerschool3.niskyschools.org/public/');

	// LOG IN
	session.sendLog('Logging in...');
	await page.type('#fieldAccount', options.username);
	await page.type('#fieldPassword', options.password);
	await page.click('#btn-enter-sign-in');
	await page.waitForNavigation();

	session.state.auth = true;
});

const inputSchemas = {
	OPTIONS: new Schema(`
    username=string
    password=string
    `)
};
