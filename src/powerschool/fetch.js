const Action = require('./../action');

module.exports = new Action(`
screenshots=boolean?
deep=boolean?
`, async (session, options) => {
    const page = session.page;

    if (session.state.auth !== true) {
        session.sendError('not logged in');
        return;
    }

    // TAKE SCREENSHOT
    session.sendLog('Taking screenshot...');
    if (options.screenshots) session.sendImage('MAIN_PAGE', await session.takeScreenshot({
        fullPage: 'true'
    }));

    // SCRAPE MAIN PAGE
    session.sendLog('Scraping main page...');
    let result = await page.evaluate(() => {
        let safeParseInt = a => {
            const b = parseInt(a.trim());
            return isNaN(b) ? '' : b;
        };

        let safeParseIntContent = e => {
            if (e === null || e === undefined) return '';
            return safeParseInt(e.textContent);
        };
    
        let safeTextContent = e => {
            if (e === null || e === undefined) return '';
            return e.textContent.trim();
        };

        let safeNodeValue = e => {
            if (e === null || e === undefined) return '';
            return e.nodeValue.trim();
        };

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
            const rawEmail = e.querySelector(':nth-child(12) > a:nth-child(3)').href.split(':')[1];
            courses.push({
                expression: safeTextContent(e.querySelector(':nth-child(1)')),
                name: safeNodeValue(e.querySelector(':nth-child(12)').childNodes[0]),
                email: rawEmail.startsWith('no.email.address') ? '' : rawEmail,
                room: safeTextContent(e.querySelector(':nth-child(12)')).split(':')[1].trim(),
                teacher: safeTextContent(e.querySelector(':nth-child(12) > a:nth-child(3)')).substring(6),
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
                tardies: safeParseIntContent(e.querySelector(':nth-child(21)'))
            });
        }

        return {
            courses: courses,
            totalAbsences: safeParseIntContent(document.querySelector('#quickLookup > table.linkDescList.grid > tbody > tr:nth-child(21) > th:nth-child(2) > a')),
            totalTardies: safeParseIntContent(document.querySelector('#quickLookup > table.linkDescList.grid > tbody > tr:nth-child(21) > th:nth-child(3) > a'))
        };
    });

    if (options.deep) {
    // GET LINKS
        session.sendLog('Getting links...');
        const links = await page.evaluate(() => {
            let links = [];
            [...document.querySelectorAll('#quickLookup > table.linkDescList.grid > tbody > tr > td:nth-child(19) > a')].forEach(x => {
                links.push(x.href);
            });
            return links;
        });

        // SCRAPE COURSE PAGES
        session.sendLog('Scraping course pages (' + links.length + ')...');
        for (let i = 0; i < links.length; ++i) {
            session.sendLog('    scraping page ' + (i + 1) + ' of ' + links.length + '...');
            const link = links[i];
            await page.goto(link);
            if (options.screenshots) session.sendImage('SCREENSHOT_COURSE_' + i, await session.takeScreenshot({
                fullPage: 'true'
            }));
            Object.assign(result.courses[i], await page.evaluate(() => {
                let safeParseInt = a => {
                    const b = parseInt(a.trim());
                    return isNaN(b) ? '' : b;
                };

                let safeParseIntContent = e => {
                    if (e === null || e === undefined) return '';
                    return safeParseInt(e.textContent);
                };
        
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

                return course;
            }));
        }
    }

    session.sendOutput('RESULT', result);
});
