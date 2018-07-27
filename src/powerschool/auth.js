const Action = require('./../action');

module.exports = new Action(`
username=string
password=string
`, async (session, options) => {
    const page = session.page;

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
