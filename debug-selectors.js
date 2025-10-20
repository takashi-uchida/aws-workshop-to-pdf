const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const url = 'https://catalog.us-east-1.prod.workshops.aws/workshops/015a2de4-9522-4532-b2eb-639280dc31d8/en-US';
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const links = await page.evaluate(() => {
    const results = {};
    const selectors = [
      "nav a[href*='/en-US']",
      "[role='navigation'] a[href*='/en-US']",
      "aside a[href*='/en-US']",
      ".navigation a[href*='/en-US']",
      "a[href*='/en-US']"
    ];
    
    selectors.forEach(sel => {
      const els = document.querySelectorAll(sel);
      results[sel] = els.length;
    });
    
    const allLinks = [];
    document.querySelectorAll("a[href*='/en-US']").forEach(el => {
      allLinks.push({ href: el.href, text: el.textContent.trim().substring(0, 50) });
    });
    
    return { counts: results, sample: allLinks.slice(0, 10) };
  });
  
  console.log('セレクタ別ヒット数:', links.counts);
  console.log('\nサンプルリンク:');
  links.sample.forEach((l, i) => console.log(`${i+1}. ${l.text} -> ${l.href}`));
  
  await browser.close();
})();
