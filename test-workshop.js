const { chromium } = require('playwright');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const url = 'https://catalog.us-east-1.prod.workshops.aws/workshops/015a2de4-9522-4532-b2eb-639280dc31d8/en-US';
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  // ナビゲーションリンクを取得
  const links = await page.evaluate(() => {
    const navLinks = [];
    const selectors = [
      'nav a[href*="/en-US"]',
      '[role="navigation"] a[href*="/en-US"]',
      '.navigation a[href*="/en-US"]',
      'aside a[href*="/en-US"]'
    ];
    
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        const href = el.href;
        const text = el.textContent.trim();
        if (href && text && !navLinks.find(l => l.url === href)) {
          navLinks.push({ url: href, title: text });
        }
      });
    });
    
    return navLinks;
  });
  
  console.log(`\n📚 見つかったページ: ${links.length}`);
  links.forEach((link, i) => console.log(`${i+1}. ${link.title}`));
  
  const pdfBuffers = [];
  
  for (let i = 0; i < Math.min(links.length, 5); i++) {
    const link = links[i];
    console.log(`\n📄 処理中 (${i+1}/${links.length}): ${link.title}`);
    
    await page.goto(link.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });
    
    pdfBuffers.push(pdf);
  }
  
  // PDFマージ
  const mergedPdf = await PDFDocument.create();
  for (const pdfBuffer of pdfBuffers) {
    const pdf = await PDFDocument.load(pdfBuffer);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach(page => mergedPdf.addPage(page));
  }
  
  const mergedBytes = await mergedPdf.save();
  fs.writeFileSync('workshop-output.pdf', mergedBytes);
  
  const pageCount = mergedPdf.getPageCount();
  console.log(`\n✅ 完了: ${pageCount}ページのPDFを生成`);
  console.log(`📄 ファイル: workshop-output.pdf (${mergedBytes.length} bytes)`);
  
  await browser.close();
})();
