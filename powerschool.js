const program = require('commander');
const usaco = require('./src/usaco-trainer/action-module');
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
    session.pushInput({
      tag: 'OPTIONS',
      screnshots: true
    });
    session.pushInput({
      tag: 'ITEM_ID',
      item: 4
    });
    await session.runAction(usaco.actions.fetch);
    await session.end();
  });

program.parse(process.argv);
