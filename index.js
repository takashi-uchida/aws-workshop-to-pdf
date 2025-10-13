const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function convertWorkshopToPDF() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();
  
  console.log('Navigating to AWS Workshop page...');
  await page.goto('https://catalog.workshops.aws/saas-operations/en-US', {
    waitUntil: 'networkidle',
    timeout: 60000
  });

  // Wait for content to load
  await page.waitForTimeout(5000);

  // Create output directory if it doesn't exist
  const outputDir = 'output';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const outputPath = path.join(outputDir, `aws-saas-operations-workshop-${timestamp}.pdf`);

  console.log('Generating PDF...');
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20px',
      bottom: '20px',
      left: '20px',
      right: '20px'
    },
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%;">AWS SaaS Operations Workshop</div>',
    footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
  });

  console.log(`PDF saved to: ${outputPath}`);

  // Check if there are multiple pages to navigate
  const hasMultiplePages = await page.$$eval('a', links => {
    return links.some(link => link.href && (link.href.includes('/en-US/') || link.href.includes('module')));
  });

  if (hasMultiplePages) {
    console.log('\nThis workshop has multiple sections.');
    console.log('To capture all content, you may want to navigate through each section manually.');
    console.log('Consider extending this script to crawl through all workshop pages.');
  }

  await browser.close();
}

// Run the conversion
convertWorkshopToPDF().catch(console.error);