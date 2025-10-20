const { chromium } = require('playwright');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🌐 アクセス中: https://aws-workshop-to-pdf.web.app');
  await page.goto('https://aws-workshop-to-pdf.web.app');
  await page.waitForLoadState('networkidle');
  
  const testUrl = 'https://catalog.us-east-1.prod.workshops.aws/workshops/015a2de4-9522-4532-b2eb-639280dc31d8/en-US';
  console.log(`📝 URL入力: ${testUrl}`);
  await page.fill('#single-url', testUrl);
  
  console.log('⏳ PDF変換開始...');
  const downloadPromise = page.waitForEvent('download', { timeout: 320000 });
  await page.click('#convert-single');
  
  const download = await downloadPromise;
  const downloadPath = './workshop-full.pdf';
  await download.saveAs(downloadPath);
  
  console.log('✅ PDFダウンロード成功');
  
  const pdfBytes = fs.readFileSync(downloadPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pageCount = pdfDoc.getPageCount();
  
  console.log('\n📊 PDF検証結果:');
  console.log(`   ページ数: ${pageCount}`);
  console.log(`   ファイルサイズ: ${(pdfBytes.length / 1024 / 1024).toFixed(2)} MB`);
  
  if (pageCount > 1) {
    console.log(`\n✅ 全ページが1つのPDFに統合されています (${pageCount}ページ)`);
  } else {
    console.log(`\n❌ 問題: 1ページしか生成されていません`);
  }
  
  await browser.close();
})();
