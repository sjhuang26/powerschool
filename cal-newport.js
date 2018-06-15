const program = require('commander');
const calNewportBlog = require('./src/cal-newport/cal-newport-blog');

program
  .command('blog')
  .description(`fetch from Cal Newport's blog`)
  .option('-h, --no-headless', 'disable headless mode')
  .action(options => {
    calNewportBlog('output/cal-newport/blog')(options.headless);
  });
program.parse(process.argv);
