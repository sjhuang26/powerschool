const program = require('commander');
const aops = require('./src/aops/action-module');
const Session = require('./src/session');
const utils = require('./src/utils');

/*program
  .command('fetch')
  .description('fetch grades from PowerSchool')
  .option('-u, --username <username>', 'username')
  .option('-p, --password <password>', 'password')
  .option('-s, --shallow', 'only fetch main page')
  .option('-v, --screenshots', 'add screenshots')
  .option('-h, --no-headless', 'disable headless mode')
  .action(options => {
    powerschoolFetch('output/powerschool/fetch', options.username, options.password, options.shallow, options.screenshots, options.headless);
  });*/
program
  .command('test')
  .description('test')
  .action(async (options) => {
    const session = new Session({
      directory: 'output'
    });
    await session.start();
    await aops.actions.users.run(session, {});
    await session.end();
  });

program.parse(process.argv);
