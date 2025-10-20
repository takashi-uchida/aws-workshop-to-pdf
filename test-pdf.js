const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://aws-workshop-to-pdf.web.app');
  await page.waitForLoadState('networkidle');
  
  // テストURL入力
  await page.fill('#single-url', 'https://example.com');
  
  // PDFダウンロード待機
  const downloadPromise = page.waitForEvent('download', { timeout: 90000 });
  await page.click('#convert-single');
  
  const download = await downloadPromise;
  const downloadPath = path.join(__dirname, 'test-output.pdf');
  await download.saveAs(downloadPath);
  
  // PDFファイル確認
  const stats = fs.statSync(downloadPath);
  console.log(`✅ PDF生成成功: ${stats.size} bytes`);
  console.log(`📄 ファイル: ${downloadPath}`);
  
  // PDFページ数確認（簡易チェック）
  const pdfBuffer = fs.readFileSync(downloadPath);
  const pageCount = (pdfBuffer.toString().match(/\/Type[\s]*\/Page[^s]/g) || []).length;
  console.log(`📖 推定ページ数: ${pageCount}`);
  
  await browser.close();
})();
