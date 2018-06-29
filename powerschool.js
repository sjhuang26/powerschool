const program = require('commander');
const powerschoolFetch = require('./src/powerschool/powerschool-fetch');

program
  .command('fetch')
  .description('fetch grades from PowerSchool')
  .option('-u, --username <username>', 'username')
  .option('-p, --password <password>', 'password')
  .option('-s, --shallow', 'only fetch main page')
  .option('-v, --screenshots', 'add screenshots')
  .option('-h, --no-headless', 'disable headless mode')
  .action(options => {
    powerschoolFetch('output/powerschool/fetch', options.username, options.password, options.shallow, options.screenshots, options.headless);
  });
program.parse(process.argv);
