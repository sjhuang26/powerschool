const program = require('commander');
const aopsUsers = require('./src/aops/aops-users');

program
  .command('users')
  .description('fetch online users from Art of Problem Solving')
  .option('-h, --no-headless', 'disable headless mode')
  .action(options => {
    aopsUsers('output/aops/users')(options.headless);
  });
program.parse(process.argv);
