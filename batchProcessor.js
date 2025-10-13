/**
 * Batch Processor Module
 * 複数URLのバッチ処理を管理する
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
const { reportStart, reportProgress, reportSummary } = require('./progressReporter');
const { generateFileNameFromTitle, ensureUniqueFileName } = require('./fileNameGenerator');

/**
 * BatchProcessor クラス
 * 複数URLのバッチ処理を管理
 */
class BatchProcessor {
  /**
   * コンストラクタ
   * @param {Object} options - 処理オプション
   */
  constructor(options) {
    this.options = options;
    this.results = [];
    this.startTime = null;
    this.browser = null;
    this.outputDir = null;
  }

  /**
   * バッチ処理を実行
   * @param {string[]} urls - 処理するURL配列
   * @returns {Promise<Object>} - 処理結果のサマリー
   */
  async processBatch(urls) {
    this.startTime = Date.now();
    
    // バッチディレクトリの作成
    this.outputDir = await this.createBatchDirectory();
    
    // ブラウザインスタンスの起動
    this.browser = await chromium.launch({ headless: true });
    
    // 進行状況の開始報告
    reportStart(urls.length);
    
    try {
      // 各URLを順次処理
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        console.log(`\n[${i + 1}/${urls.length}] 処理中: ${url}`);
        
        const result = await this.processUrl(url, i);
        this.results.push(result);
        
        // 進行状況を報告
        reportProgress(i + 1, urls.length, url, result);
        
        // 次のURLまで待機
        if (i < urls.length - 1 && this.options.delay) {
          await new Promise(resolve => 
            setTimeout(resolve, parseInt(this.options.delay))
          );
        }
      }
      
      // サマリーを生成
      const summary = this.generateSummary();
      
      // サマリーを報告
      reportSummary(summary, this.outputDir);
      
      // サマリーをJSONファイルに保存
      await this.saveSummary(summary);
      
      return summary;
      
    } finally {
      // ブラウザインスタンスの終了
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  /**
   * 単一URLを処理（リトライロジック付き）
   * @param {string} url - 処理するURL
   * @param {number} index - URL番号
   * @returns {Promise<Object>} - 処理結果
   */
  async processUrl(url, index) {
    const maxRetries = 3;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.convertUrl(url, index);
        
        if (result.success) {
          return {
            url,
            status: 'success',
            fileName: result.fileName,
            outputPath: result.outputPath,
            attempt,
            timestamp: Date.now()
          };
        }
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          console.log(`  ⚠️ リトライ ${attempt}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    return {
      url,
      status: 'failed',
      error: lastError?.message || 'Unknown error',
      attempts: maxRetries,
      timestamp: Date.now()
    };
  }

  /**
   * URLを変換
   * @param {string} url - 変換するURL
   * @param {number} index - URL番号
   * @returns {Promise<Object>} - 変換結果 {success, fileName, outputPath}
   */
  async convertUrl(url, index) {
    const page = await this.browser.newPage();
    
    try {
      // ページに移動
      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 60000 
      });
      
      // 待機時間
      if (this.options.wait) {
        await page.waitForTimeout(parseInt(this.options.wait));
      }
      
      // スクロール（オプション）
      if (!this.options.noScroll) {
        await this.autoScroll(page);
      }
      
      // ファイル名を生成
      const fileName = await generateFileNameFromTitle(page, url);
      const uniqueFileName = await ensureUniqueFileName(this.outputDir, fileName);
      const outputPath = path.join(this.outputDir, uniqueFileName);
      
      // PDF生成
      await page.pdf({
        path: outputPath,
        format: this.options.format || 'A4',
        landscape: this.options.landscape || false,
        margin: {
          top: this.options.margin || '20px',
          bottom: this.options.margin || '20px',
          left: this.options.margin || '20px',
          right: this.options.margin || '20px'
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
      
      return {
        success: true,
        fileName: uniqueFileName,
        outputPath
      };
      
    } finally {
      await page.close();
    }
  }

  /**
   * 自動スクロール
   * @param {Page} page - Playwrightのページオブジェクト
   */
  async autoScroll(page) {
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

  /**
   * 処理結果のサマリーを生成
   * @returns {Object} - サマリー情報
   */
  generateSummary() {
    const endTime = Date.now();
    const duration = (endTime - this.startTime) / 1000;
    
    const successful = this.results.filter(r => r.status === 'success');
    const failed = this.results.filter(r => r.status === 'failed');
    
    return {
      total: this.results.length,
      successful: successful.length,
      failed: failed.length,
      duration,
      outputDir: this.outputDir,
      timestamp: new Date(this.startTime).toISOString(),
      results: this.results
    };
  }

  /**
   * バッチディレクトリの作成
   * @returns {Promise<string>} - 作成されたディレクトリパス
   */
  async createBatchDirectory() {
    // ユーザーが出力ディレクトリを指定した場合はそれを使用
    if (this.options.output) {
      const outputPath = path.isAbsolute(this.options.output)
        ? this.options.output
        : path.join(process.cwd(), this.options.output);
      
      await fs.mkdir(outputPath, { recursive: true });
      return outputPath;
    }
    
    // デフォルト: output/batch_YYYYMMDD_HHMMSS/ 形式
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/T/, '_')
      .replace(/:/g, '')
      .replace(/\..+/, '')
      .substring(0, 15); // YYYYMMDD_HHMMSS
    
    const batchDir = path.join(process.cwd(), 'output', `batch_${timestamp}`);
    await fs.mkdir(batchDir, { recursive: true });
    
    return batchDir;
  }

  /**
   * batch_summary.jsonの保存
   * @param {Object} summary - サマリー情報
   */
  async saveSummary(summary) {
    const summaryPath = path.join(this.outputDir, 'batch_summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
    console.log(`\n📄 サマリー保存: ${summaryPath}`);
  }
}

module.exports = { BatchProcessor };
