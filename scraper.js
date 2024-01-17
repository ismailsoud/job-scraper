const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const upworkUrl = 'https://www.upwork.com/nx/search/jobs';
const freelancerUrl = 'https://www.freelancer.com/jobs/';
const mostaqlUrl = 'https://mostaql.com/projects';

async function scrapeUpwork(page, query, nResults) {
  const url = `${upworkUrl}?per_page=${nResults}&q=${query}&sort=recency&t=1`;
  await page.goto(url, { timeout: 0 });
  const jobs = await page.evaluate(() => {
    const jobElements = document.querySelectorAll('[data-test="JobTile"]');
      
      // Use spread operator to convert NodeList to array
      return [...jobElements].map((jobElement) => {
        try {
          const titleElement = jobElement.querySelector('.job-tile-title a');
          const descriptionElement = jobElement.querySelector('[data-test="UpCLineClamp JobDescription"] div p')
          const priceElement = jobElement.querySelector('li strong:nth-of-type(2)');
          const timeElement = jobElement.querySelector('[data-test="posted-on"]');
          const linkElement = jobElement.querySelector('.up-n-link');
  
          const title = titleElement ? titleElement.innerText.trim() : '';
          const description = descriptionElement ? descriptionElement.innerText.trim() : '';
          const price = priceElement ? priceElement.innerText.trim() : '';
          const timee = timeElement ? timeElement.innerText.trim() : '';
          const link = linkElement ? `https://www.upwork.com${linkElement.getAttribute('href')}` : '';
          const site = 'upwork';
  
          // Format the time
          const [timeNum, timeUnit] = timee.split(' ');
          const timeAgo = new Date();
          
          if (timeUnit) {
            const timeDict = {
              seconds: 'Seconds',
              second: 'Seconds',
              minutes: 'Minutes',
              minute: 'Minutes',
              hours: 'Hours',
              hour: 'Hours',
              weeks: 'Date',
              week: 'Date'
            };
  
            const unitKey = timeUnit.toLowerCase();
            const setMethod = `set${timeDict[unitKey]}`;

            if (timeDict[unitKey]) {
              timeAgo[setMethod](timeAgo[`get${timeDict[unitKey]}`]() - timeNum);
            }
          }
 
          const time = timeAgo.toISOString().replace('T', ' ').replace(/\.\d{3}Z/, '');
    
          return {
            title,
            description,
            price,
            time,
            link,
            site
          };    
        } catch (error) {
          console.error('Error in mapping:', error);
          return {};
        }
      });
    });
    if(jobs[0].title === '' && jobs[0].time === '' && jobs[0].price === '' && jobs[0].title === ''){
      let upHtml =  await page.content();
      let htmlLogPath = `${process.cwd()}/Logs/upworkHtmlLog.html`;

      let LogPath = `${process.cwd()}/Logs/log.text`;
      let log =
      'Error:\n' +
      '  All the fields are empty; the site\'s HTML might have changed.\n' +
      '  HTML content has been written to ' + path.resolve(htmlLogPath);

      fs.writeFileSync(htmlLogPath, upHtml, 'utf-8');
      fs.writeFileSync(LogPath, log, 'utf-8');
    }
    return jobs
}

async function scrapeFreelancer(page, query, nResults) {
  const freelancerDataArray = [];

  try {
    const url = `${freelancerUrl}?keyword=${query}&results=${nResults}&fixed=true`;
    await page.goto(url, { timeout: 0 });
    await page.waitForSelector('.JobSearchCard-list');

    const jobUrls = await page.$$eval('.JobSearchCard-item .JobSearchCard-primary-heading-link', links => links.map(link => link.href));

    for (const jobUrl of jobUrls.slice(0, nResults)) {
      try {
        await page.goto(jobUrl, { waitUntil: 'domcontentloaded' });
        
        try {
          await page.waitForSelector('h1', {timeout: 2000});
        } catch (error) {
            console.error('Error waiting for h1 selector:', error);
            continue; 
        }

        const postData = await page.evaluate(() => {
          try {
            const prize = document.querySelector('.logoutHero-featuredImage')
            if(prize!==null){
              return 'prize'
            }
            const titleElement = document.querySelector('h1');
            const priceElement = document.querySelector('.PageProjectViewLogout-projectInfo-byLine');
            const timeElement = document.querySelector('.PageProjectViewLogout-projectInfo-label-deliveryInfo-relativeTime');
            const descriptionElement = document.querySelector('.PageProjectViewLogout-detail');

            const link = window.location.href;
            const price = priceElement ? priceElement.innerText.trim() : '';
            const timee = timeElement ? timeElement.innerText.trim() : '';
            const title = titleElement ? titleElement.innerText.trim() : '';
            const description = descriptionElement ? descriptionElement.innerText.trim() : '';
            const site = 'freelancer';

            const timeDict = {
              seconds: "Seconds",
              second: "Seconds",
              minutes: "Minutes",
              minute: "Minutes",
              hours: "Hours",
              hour: "Hours",
              weeks: "Date",
              week: "Date"
            };

            const [timeNum, timeUnit] = timee.slice(49).split(" ");
            const timeAgo = new Date();

            if (timeUnit.toLowerCase() === 'weeks') {
              timeAgo.setDate(timeAgo.getDate() - (timeNum * 7));
            } else {
              const unitKey = timeUnit.toLowerCase();
              timeAgo[`set${timeDict[unitKey]}`](timeAgo[`get${timeDict[unitKey]}`]() - timeNum);
            }

            const time = timeAgo.toISOString().replace("T", " ").replace(/\.\d{3}Z/, "");

            if (title === '') {
              console.log('No result');
              return { error: 'title is empty' };
            } else {
              return {
                title,
                description,
                price,
                time,
                link,
                site
              };
            }
          } catch (error) {
            console.log('Error:', error);
          }
        });

        if (postData && !postData.error && postData !== 'prize'){
          freelancerDataArray.push(postData);
        }
      } catch (error) {
        console.log('Error:', error);
      }
    }
  } catch (error) {
    console.log('Error:', error);
  }

  return freelancerDataArray;
}

async function scrapeMostaql(page, query) {
        const url = `${mostaqlUrl}?per_page=&q=${query}&sort=recency&t=1`;
        await page.goto(url, { timeout: 0 });
        await page.waitForSelector('.project-row');
    
        const posts = await page.$$('.project-row');
        const data = []
        for (let i = 0; i < Math.min(posts.length, 10); i++) {
          try {
            await page.evaluate(async (postSelector, i) => {
              const postElement = document.querySelector(postSelector);
              const link = postElement.querySelector('.details-url');
              link.click();
              window.clickedPostIndex = i + 1;
            }, `.project-row:nth-child(${i + 1})`, i);
    
            await page.waitForSelector('[data-type="page-header-title"]');
    
            const postData = await page.evaluate(() => {
              const titleElement = document.querySelector('[data-type="page-header-title"]');
              const priceElement = document.querySelector('#project-meta-panel > div:nth-child(1) > table > tbody > tr:nth-child(5) > td:nth-child(2) > span');
              const descriptionElement = document.querySelector('.text-wrapper-div.carda__content');
              const paragraphs = descriptionElement.querySelectorAll('p');

              try{
                const time = document.querySelector('[itemprop="datePublished"]').getAttribute('datetime');
                const link = window.location.href;
                const price = priceElement ? priceElement.innerText.trim() : '';
                const title = titleElement ? titleElement.innerText.trim() : '';
                const description = paragraphs ?Array.from(paragraphs, paragraph => paragraph.textContent.trim()): '';
                const site = 'mostaql';
                return { title, description, price, time, link, site };
                
              }catch{
                  const time = "Non specified"
                  const link = window.location.href;
                  const description = paragraphs ?Array.from(paragraphs, paragraph => paragraph.textContent.trim()): '';
                  const price = priceElement ? priceElement.innerText.trim() : '';
                  const title = titleElement ? titleElement.innerText.trim() : '';
                  const site = 'mostaql';
                  return { title, description, price, time, link, site };
              }
            });
    
            data.push(postData);
            await page.goBack();
          } catch (error) {
            console.log('error:', error);
          }
        }
        return data
}

async function scrapeAll(query, nResults) {
  const browser = await puppeteer.launch({ headless: false,});
  const page = await browser.newPage();

  try {
    const data = [];

    // Upwork scraping
    const upWorkData = await scrapeUpwork(page, query, nResults);
    data.push(...upWorkData);
 
    // Freelancer scraping
    const freelancerData = await scrapeFreelancer(page, query, nResults);
    data.push(...freelancerData);

    // Mostaql scraping
    const mostaqlData = await scrapeMostaql(page, query, nResults);
    data.push(...mostaqlData);

    return data;
  } catch (error) {
    console.error('Error during scraping:', error);
    return [];
  } finally {
    await browser.close();
  }
}

async function run() {
  try {
    const data = await scrapeAll('react', 10);
    if(data.length !== 0){
      const jsonData = JSON.stringify(data, null, 2);
      const filePath = path.join(process.cwd(), 'data', 'data.json');
      fs.writeFileSync(filePath, jsonData, 'utf-8');
    }
  } catch (error) {
    console.error('Error during execution:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const logPath = path.join(process.cwd(), 'logs', 'log.txt');
    fs.writeFileSync(logPath, errorMessage, 'utf-8');
  }
}

run();
function startScraping() {
  setTimeout(() => {
    run()
    startScraping(); // Schedule the next execution after the current one completes
  }, 3600000);
}

module.exports = { startScraping };