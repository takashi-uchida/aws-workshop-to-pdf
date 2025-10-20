const { chromium } = require('playwright');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🌐 https://aws-workshop-to-pdf.web.app にアクセス');
  await page.goto('https://aws-workshop-to-pdf.web.app');
  await page.waitForLoadState('networkidle');
  
  const url = 'https://catalog.us-east-1.prod.workshops.aws/workshops/015a2de4-9522-4532-b2eb-639280dc31d8/en-US';
  console.log(`📝 URL入力: ${url}`);
  await page.fill('#single-url', url);
  
  console.log('⏳ PDF変換開始...');
  const downloadPromise = page.waitForEvent('download', { timeout: 320000 });
  await page.click('#convert-single');
  
  const download = await downloadPromise;
  const path = './verified-workshop.pdf';
  await download.saveAs(path);
  
  console.log('✅ PDFダウンロード成功\n');
  
  const pdfBytes = fs.readFileSync(path);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pageCount = pdfDoc.getPageCount();
  
  console.log('📊 pdf-libでPDF構造を検証:');
  console.log(`   ページ数: ${pageCount}`);
  console.log(`   ファイルサイズ: ${(pdfBytes.length / 1024 / 1024).toFixed(2)} MB`);
  
  if (pageCount > 10) {
    console.log(`\n✅ 全ページが1つのPDFに統合されています (${pageCount}ページ)`);
  } else {
    console.log(`\n❌ 問題: ${pageCount}ページしか生成されていません`);
  }
  
  await browser.close();
})();
