const puppeteer = require('puppeteer');
const promptly = require('promptly');
const fileSystem = require('fs');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');

let powerschool = async () => {
  // INIT

  // Nope, you aren't going to find my PowerSchool password here!
  const password = await promptly.prompt("Password: ");

  rimraf.sync('output');
  mkdirp.sync('output');

  // LOAD BROWSER
  console.log("Loading browser...");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({
    width: 1500,
    height: 750
  });

  // LOAD WEBSITE
  console.log("Loading website...");
  await page.goto('https://powerschool3.niskyschools.org/public/');

  // LOG IN
  console.log("Logging in...");
  await page.type('#fieldAccount', 'hua08355');
  await page.type('#fieldPassword', password);
  await page.click('#btn-enter-sign-in');
  await page.waitForNavigation();

  // TAKE SCREENSHOT
  console.log("Taking screenshot...");
  await page.screenshot({
    path: 'output/screenshot-main-page.png',
    fullPage: 'true'
  });

  // GET LINKS
  console.log("Getting links...");
  const links = await page.evaluate(() => {
    let links = [];
    [...document.querySelectorAll('#quickLookup > table.linkDescList.grid > tbody > tr > td:nth-child(19) > a')].forEach(x => {
      links.push(x.href);
    });
    return links;
  });

  // SCRAPE MAIN PAGE
  console.log("Scraping main page...");
  let result = await page.evaluate(() => {
    let safeParseInt = a => {
      const b = parseInt(a.trim());
      return isNaN(b) ? '' : b;
    };

    let safeParseIntContent = e => {
      if (e === null || e === undefined) return '';
      return safeParseInt(e.textContent);
    }
    
    let safeTextContent = e => {
      if (e === null || e === undefined) return '';
      return e.textContent.trim();
    };

    let safeNodeValue = e => {
      if (e === null || e === undefined) return '';
      return e.nodeValue.trim();
    }

    let parseGradeLink = e => {
      if (e === null || e === undefined || safeTextContent(e) === '[ i ]') {
        return {
          letterGrade: '',
          percentageGrade: ''
        };
      } else {
        return {
          letter: e.childNodes[0].nodeValue.trim(),
          percentage: e.childNodes[2].nodeValue.trim()
        };
      }
    };

    let parseGrade = e => {
      let result = parseGradeLink(e.querySelector(':scope > a'));
      return Object.assign({
        effort: safeNodeValue(e.childNodes[2])
      }, result);
    };

    let courses = [];
    for (const e of document.querySelectorAll('#quickLookup > table.linkDescList.grid > tbody > tr:nth-child(n+4):not(:nth-last-child(1))')) {
      courses.push({
        grades: {
          Q1: parseGrade(e.querySelector(':nth-child(13)')),
          Q2: parseGrade(e.querySelector(':nth-child(14)')),
          Q3: parseGrade(e.querySelector(':nth-child(15)')),
          Q4: parseGrade(e.querySelector(':nth-child(16)')),
          L0: parseGrade(e.querySelector(':nth-child(17)')),
          R0: parseGrade(e.querySelector(':nth-child(18)')),
          F1: parseGrade(e.querySelector(':nth-child(19)'))
        },
        absences: safeParseIntContent(e.querySelector(':nth-child(20)')),
        tardies: safeParseIntContent(e.querySelector(':nth-child(21)')),
        room: safeTextContent(e.querySelector(':nth-child(12)')).split(':')[1].trim(),
        email: e.querySelector(':nth-child(12) > a:nth-child(3)').href.split(':')[1]
      });
    }

    return {
      courses: courses,
      totalAbsences: safeParseIntContent(document.querySelector('#quickLookup > table.linkDescList.grid > tbody > tr:nth-child(21) > th:nth-child(2) > a')),
      totalTardies: safeParseIntContent(document.querySelector('#quickLookup > table.linkDescList.grid > tbody > tr:nth-child(21) > th:nth-child(3) > a'))
    };
  });

  // SCRAPE COURSE PAGES
  console.log('Scraping course pages (' + links.length + ')...');
  for (let i = 0; i < links.length; ++i) {
    console.log('    scraping page ' + (i + 1) + ' of ' + links.length + '...');
    const link = links[i];
    await page.goto(link);
    await page.screenshot({
      path: 'output/screenshot-course-' + (i + 1) + '.png',
      fullPage: 'true'
    });
    Object.assign(result.courses[i], await page.evaluate(() => {
      let safeParseInt = a => {
        const b = parseInt(a.trim());
        return isNaN(b) ? '' : b;
      };

      let safeParseIntContent = e => {
        if (e === null || e === undefined) return '';
        return safeParseInt(e.textContent);
      }
      
      let safeTextContent = e => {
        if (e === null || e === undefined) return '';
        return e.textContent.trim();
      };

      let course = {};

      // ASSIGNMENTS
      course.assignments = [];
      if (safeTextContent(document.querySelector('#content-main > div.box-round > table:nth-child(6) > tbody > tr:nth-child(2) > td')) !== 'No assignments found.') {
        for (const e of document.querySelectorAll('#content-main > div.box-round > table:nth-child(6) > tbody > tr:nth-child(n+2)')) {
          const scoreTokens = safeTextContent(e.querySelector(':nth-child(9)')).split('/');
          let points, totalPoints;
          if (scoreTokens.length !== 2) {
            if (scoreTokens.length === 1) {
              points = safeParseInt(scoreTokens[0]);
              totalPoints = '';
            } else {
              points = '';
              totalPoints = '';
            }
          } else {
            points = safeParseInt(scoreTokens[0]);
            totalPoints = safeParseInt(scoreTokens[1]);
          }
          let flags = [];
          for (const f of e.querySelectorAll(':nth-child(n+4):nth-child(-n+8) > img')) {
            flags.push(String(f.alt).trim());
          }
          course.assignments.push({
            dueDate: safeTextContent(e.querySelector(':nth-child(1)')),
            category: safeTextContent(e.querySelector(':nth-child(2)')),
            assignment: safeTextContent(e.querySelector(':nth-child(3)')),
            flags: flags,
            points: points,
            totalPoints: totalPoints,
            percentageGrade: safeParseIntContent(e.querySelector(':nth-child(10)')),
            letterGrade: safeTextContent(e.querySelector(':nth-child(11)')),
          });
        }
      }

      // OTHER
      const $description = document.querySelector('#content-main > div.box-round > table.linkDescList > tbody > tr:nth-child(2)');
      course.name = safeTextContent($description.querySelector(':nth-child(1)'));
      course.teacher = safeTextContent($description.querySelector(':nth-child(2)'));
      course.expression = safeTextContent($description.querySelector(':nth-child(3)'));

      return course;
    }));
  }

  browser.close();
  return result;
};

powerschool().then(value => {
  fileSystem.writeFile('output/export.json', JSON.stringify(value), err => {  
    if (err) throw err;
    console.log('Done!');
  });
});
