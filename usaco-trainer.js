const program = require('commander');
const usacoTrainerFetch = require('./src/usaco-trainer/usaco-trainer-fetch');

program
  .command('fetch')
  .description('fetch problem from USACO Trainer')
  .option('-u, --username <username>', 'username')
  .option('-p, --password <password>', 'password')
  .option('-v, --screenshots', 'add screenshots')
  .option('-h, --no-headless', 'disable headless mode')
  .action(options => {
    usacoTrainerFetch('output/usaco-trainer/fetch', options.username, options.password, options.screenshots, options.headless);
  });
program.parse(process.argv);
