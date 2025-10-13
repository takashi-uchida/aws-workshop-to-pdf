#!/usr/bin/env node

const { chromium } = require('playwright');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');
const { generateFileNameFromTitle, ensureUniqueFileName } = require('./fileNameGenerator');
const { readUrlsFromFile, validateUrls } = require('./urlResolver');

program
  .name('web2pdf')
  .description('汎用的なWebページPDF変換ツール')
  .version('1.0.0')
  .option('-u, --url <url>', 'PDFに変換するURL（必須）')
  .option('--url-file <path>', 'URLリストファイルのパス（複数URL処理用）')
  .option('-o, --output <path>', '出力PDFファイル名', null)
  .option('-m, --mode <mode>', '変換モード: single（単一ページ）またはmulti（複数ページ）', 'multi')
  .option('-s, --selector <selector>', 'ナビゲーションリンクのCSSセレクター（multiモード時）', 'a')
  .option('-w, --wait <ms>', 'ページ読み込み待機時間（ミリ秒）', '3000')
  .option('-d, --delay <ms>', 'ページ間の遅延時間（ミリ秒、multiモード時）', '2000')
  .option('--no-scroll', 'スクロールを無効化')
  .option('--format <format>', 'PDFフォーマット（A4、Letter等）', 'A4')
  .option('--landscape', '横向きで出力')
  .option('--margin <margin>', 'マージン（例: 20px、1cm）', '20px')
  .parse(process.argv);

const options = program.opts();

if (!options.url && !options.urlFile) {
  console.error('エラー: URLまたはURLファイルを指定してください（-u または --url-file）');
  program.help();
  process.exit(1);
}

if (options.url && options.urlFile) {
  console.error('エラー: -u と --url-file は同時に指定できません');
  program.help();
  process.exit(1);
}

// 出力ファイル名の生成
function generateOutputName(url, mode) {
  if (options.output) {
    return options.output;
  }
  
  const hostname = new URL(url).hostname.replace(/\./g, '_');
  const timestamp = new Date().toISOString().split('T')[0];
  const suffix = mode === 'multi' ? '_complete' : '';
  return `${hostname}${suffix}_${timestamp}.pdf`;
}

// ページをPDFに変換
async function convertPageToPDF(browser, url, outputPath = null, outputDir = null) {
  const page = await browser.newPage();
  
  try {
    console.log(`📄 変換中: ${url}`);
    
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    // 待機時間
    await page.waitForTimeout(parseInt(options.wait));
    
    // スクロール（オプション）
    if (!options.noScroll) {
      await autoScroll(page);
    }
    
    // 出力パスの決定
    // 1. outputPathが明示的に指定されている場合（-oオプション使用時）はそれを優先
    // 2. 指定されていない場合はページタイトルから生成
    let finalOutputPath = outputPath;
    if (!finalOutputPath) {
      const fileName = await generateFileNameFromTitle(page, url);
      const targetDir = outputDir || path.join(process.cwd(), 'output');
      await fs.mkdir(targetDir, { recursive: true });
      const uniqueFileName = await ensureUniqueFileName(targetDir, fileName);
      finalOutputPath = path.join(targetDir, uniqueFileName);
    }
    
    // PDF生成
    await page.pdf({
      path: finalOutputPath,
      format: options.format,
      landscape: options.landscape || false,
      margin: {
        top: options.margin,
        bottom: options.margin,
        left: options.margin,
        right: options.margin
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="width: 100%; font-size: 10px; text-align: center; margin: 0 20px;">
          <span>${url}</span>
        </div>
      `,
      footerTemplate: `
        <div style="width: 100%; font-size: 10px; text-align: center; margin: 0 20px;">
          <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
        </div>
      `
    });
    
    console.log(`✅ 保存: ${finalOutputPath}`);
    return true;
  } catch (error) {
    console.error(`❌ エラー: ${url}`, error.message);
    return false;
  } finally {
    await page.close();
  }
}

// 自動スクロール
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          window.scrollTo(0, 0);
          resolve();
        }
      }, 100);
    });
  });
}

// ナビゲーションリンクの取得
async function extractNavigationLinks(page, baseUrl, selector) {
  // セレクタのエスケープ文字を正規化
  const normalizedSelector = selector.replace(/\\\\/g, '\\').replace(/\\"/g, '"');
  console.log(`🔍 使用セレクタ: ${normalizedSelector}`);
  
  const links = await page.evaluate((sel) => {
    const elements = document.querySelectorAll(sel);
    return Array.from(elements).map(el => ({
      href: el.href,
      text: el.textContent?.trim() || ''
    }));
  }, normalizedSelector);
  
  // 重複削除とフィルタリング
  const uniqueLinks = Array.from(new Set(links.map(l => l.href)))
    .filter(href => href && href.startsWith('http'))
    .map(href => links.find(l => l.href === href));
  
  console.log(`📋 ${uniqueLinks.length}個のリンクを検出`);
  return uniqueLinks;
}

// PDFのマージ
async function mergePDFs(pdfPaths, outputPath) {
  console.log('\n📚 PDFファイルを統合中...');
  
  const mergedPdf = await PDFDocument.create();
  
  for (const pdfPath of pdfPaths) {
    try {
      const pdfBytes = await fs.readFile(pdfPath);
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));
    } catch (error) {
      console.error(`⚠️ スキップ: ${pdfPath}`, error.message);
    }
  }
  
  const mergedPdfBytes = await mergedPdf.save();
  await fs.writeFile(outputPath, mergedPdfBytes);
  console.log(`✅ 統合完了: ${outputPath}`);
}

// 単一ページ変換
async function convertSinglePage() {
  const browser = await chromium.launch({ headless: true });
  
  try {
    let outputPath = null;
    let outputDir = null;
    
    // ユーザーが-oオプションで明示的に指定した場合は指定されたファイル名を使用
    if (options.output) {
      if (path.dirname(options.output) !== '.') {
        // 出力パスにディレクトリが含まれている場合
        outputPath = path.isAbsolute(options.output)
          ? options.output
          : path.join(process.cwd(), options.output);
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
      } else {
        // ファイル名のみ指定された場合
        const defaultOutputDir = path.join(process.cwd(), 'output');
        await fs.mkdir(defaultOutputDir, { recursive: true });
        outputPath = path.join(defaultOutputDir, options.output);
      }
    } else {
      // -oオプションが指定されていない場合は、タイトルベースのファイル名を使用
      outputDir = path.join(process.cwd(), 'output');
      await fs.mkdir(outputDir, { recursive: true });
    }
    
    await convertPageToPDF(browser, options.url, outputPath, outputDir);
    
    console.log(`\n✨ 変換完了`);
  } finally {
    await browser.close();
  }
}

// 複数ページ変換
async function convertMultiplePages() {
  const browser = await chromium.launch({ headless: true });
  
  try {
    const tempDir = path.join(process.cwd(), 'temp_' + Date.now());
    await fs.mkdir(tempDir, { recursive: true });
    
    // メインページからリンクを取得
    const page = await browser.newPage();
    await page.goto(options.url, { waitUntil: 'networkidle' });
    
    const links = await extractNavigationLinks(page, options.url, options.selector);
    
    // メインページも含める
    const allPages = [
      { href: options.url, text: 'Main Page' },
      ...links
    ];
    
    await page.close();
    
    // 各ページをPDFに変換
    const pdfPaths = [];
    const delay = parseInt(options.delay);
    
    for (let i = 0; i < allPages.length; i++) {
      const link = allPages[i];
      const fileName = `page_${String(i).padStart(3, '0')}.pdf`;
      const pdfPath = path.join(tempDir, fileName);
      
      const success = await convertPageToPDF(browser, link.href, pdfPath);
      
      if (success) {
        pdfPaths.push(pdfPath);
      }
      
      // 次のページまで待機
      if (i < allPages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // PDFを統合
    const outputName = generateOutputName(options.url, 'multi');
    let outputPath;
    
    if (options.output && path.dirname(options.output) !== '.') {
      // 出力パスにディレクトリが含まれている場合
      outputPath = path.isAbsolute(options.output)
        ? options.output
        : path.join(process.cwd(), options.output);
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
    } else {
      // デフォルトのoutputディレクトリを使用
      const outputDir = path.join(process.cwd(), 'output');
      await fs.mkdir(outputDir, { recursive: true });
      outputPath = path.join(outputDir, outputName);
    }
    
    await mergePDFs(pdfPaths, outputPath);
    
    // 一時ファイルを削除
    console.log('\n🧹 一時ファイルを削除中...');
    for (const pdfPath of pdfPaths) {
      await fs.unlink(pdfPath).catch(() => {});
    }
    await fs.rmdir(tempDir).catch(() => {});
    
    console.log(`\n✨ 変換完了: ${outputPath}`);
    console.log(`📊 統計: ${pdfPaths.length}/${allPages.length} ページを統合`);
    
  } finally {
    await browser.close();
  }
}

// メイン処理
async function main() {
  console.log('🚀 Web to PDF Converter');
  console.log('========================');
  
  try {
    // 6.1 URL入力の解析ロジック
    let urls = [];
    
    if (options.urlFile) {
      // --url-fileオプションが指定された場合はファイルから読み込み
      console.log(`📂 URLファイルから読み込み: ${options.urlFile}`);
      urls = await readUrlsFromFile(options.urlFile);
      console.log(`📋 ${urls.length}個のURLを読み込みました\n`);
    } else if (options.url) {
      // -uオプションが指定された場合は単一URLとして処理
      urls = [options.url];
    }
    
    // URLが空の場合はエラー
    if (urls.length === 0) {
      console.error('❌ エラー: 有効なURLが見つかりませんでした');
      process.exit(1);
    }
    
    // 6.2 URL検証を追加
    const validationResults = validateUrls(urls);
    const validUrls = validationResults.filter(r => r.isValid).map(r => r.url);
    const invalidUrls = validationResults.filter(r => !r.isValid);
    
    // 無効なURLがある場合は警告を表示
    if (invalidUrls.length > 0) {
      console.warn('⚠️ 警告: 以下の無効なURLはスキップされます:');
      invalidUrls.forEach(result => {
        console.warn(`  - ${result.url}`);
        console.warn(`    理由: ${result.error}`);
      });
      console.log('');
    }
    
    // 有効なURLがない場合はエラー
    if (validUrls.length === 0) {
      console.error('❌ エラー: 有効なURLがありません');
      process.exit(1);
    }
    
    console.log(`モード: ${options.mode}`);
    console.log('');
    
    // 6.3 バッチ処理と単一処理の分岐を実装
    if (validUrls.length > 1) {
      // 複数URLの場合はBatchProcessorを使用
      console.log(`📦 バッチ処理モード: ${validUrls.length}個のURL\n`);
      
      const { BatchProcessor } = require('./batchProcessor');
      const batchProcessor = new BatchProcessor(options);
      
      await batchProcessor.processBatch(validUrls);
      
    } else {
      // 単一URLの場合は既存の処理フローを使用
      console.log(`URL: ${validUrls[0]}\n`);
      
      if (options.mode === 'multi') {
        await convertMultiplePages();
      } else {
        await convertSinglePage();
      }
    }
    
  } catch (error) {
    // 6.4 エラーハンドリングを強化
    console.error('\n❌ エラーが発生しました:', error.message);
    
    // エラーの種類に応じて処理を判断
    if (error.message.includes('URLファイルの読み込みに失敗')) {
      console.error('💡 ヒント: URLファイルのパスが正しいか確認してください');
    } else if (error.message.includes('ENOENT')) {
      console.error('💡 ヒント: 指定されたファイルが存在しません');
    } else if (error.message.includes('EACCES')) {
      console.error('💡 ヒント: ファイルへのアクセス権限がありません');
    } else if (error.message.includes('Timeout')) {
      console.error('💡 ヒント: ネットワーク接続を確認するか、--wait オプションで待機時間を増やしてください');
    }
    
    process.exit(1);
  }
}

main();