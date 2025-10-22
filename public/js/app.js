/**
 * メインアプリケーション
 */
class App {
  constructor() {
    this.apiClient = new ApiClient();
    this.settings = this.loadSettings();
    this.currentTab = 'single';
  }

  /**
   * アプリケーション初期化
   */
  init() {
    // DOM要素の取得
    this.elements = {
      // タブ
      tabs: document.querySelectorAll('.tab'),
      tabContents: document.querySelectorAll('.tab-content'),
      
      // 単一URL
      singleUrl: document.getElementById('single-url'),
      convertSingle: document.getElementById('convert-single'),
      singleError: document.getElementById('single-error'),
      
      // バッチ
      batchUrls: document.getElementById('batch-urls'),
      convertBatch: document.getElementById('convert-batch'),
      batchError: document.getElementById('batch-error'),
      urlCount: document.getElementById('url-count'),
      
      // 設定
      pageSize: document.getElementById('page-size'),
      printBackground: document.getElementById('print-background'),
      
      // 進捗・結果
      progressArea: document.getElementById('progress-area'),
      progressFill: document.getElementById('progress-fill'),
      statusMessage: document.getElementById('status-message'),
      resultsArea: document.getElementById('results-area'),
      resultsContent: document.getElementById('results-content'),
      
      // ヘルプ
      helpLink: document.getElementById('help-link'),
      helpModal: document.getElementById('help-modal'),
      closeModal: document.getElementById('close-modal'),
    };

    // イベントリスナーの設定
    this.setupEventListeners();
    
    // 設定の復元
    this.restoreSettings();
  }

  /**
   * イベントリスナーの設定
   */
  setupEventListeners() {
    // タブ切り替え
    this.elements.tabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });

    // 単一URL変換
    this.elements.convertSingle.addEventListener('click', () => {
      this.handleSingleConversion();
    });

    // バッチ変換
    this.elements.convertBatch.addEventListener('click', () => {
      this.handleBatchConversion();
    });

    // URL数カウント
    this.elements.batchUrls.addEventListener('input', () => {
      this.updateUrlCount();
    });

    // 設定変更
    this.elements.pageSize.addEventListener('change', () => {
      this.saveSettings();
    });

    this.elements.printBackground.addEventListener('change', () => {
      this.saveSettings();
    });

    // ヘルプモーダル
    this.elements.helpLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.elements.helpModal.style.display = 'flex';
    });

    this.elements.closeModal.addEventListener('click', () => {
      this.elements.helpModal.style.display = 'none';
    });

    this.elements.helpModal.addEventListener('click', (e) => {
      if (e.target === this.elements.helpModal) {
        this.elements.helpModal.style.display = 'none';
      }
    });
  }

  /**
   * タブ切り替え
   * @param {string} tabName - タブ名
   */
  switchTab(tabName) {
    this.currentTab = tabName;

    this.elements.tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    this.elements.tabContents.forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}-tab`);
    });

    // エラーメッセージをクリア
    this.elements.singleError.textContent = '';
    this.elements.batchError.textContent = '';
  }

  /**
   * URL数を更新
   */
  updateUrlCount() {
    const urls = parseURLList(this.elements.batchUrls.value);
    this.elements.urlCount.textContent = `${urls.length} URLs`;
  }

  /**
   * 単一URL変換ハンドラー
   */
  async handleSingleConversion() {
    const url = this.elements.singleUrl.value.trim();

    // URL検証
    if (!url) {
      this.elements.singleError.textContent = 'URLを入力してください';
      return;
    }

    if (!isValidURL(url)) {
      this.elements.singleError.textContent = '無効なURLです。正しい形式で入力してください。';
      return;
    }

    this.elements.singleError.textContent = '';

    // UI更新
    this.showProgress('PDF変換中...');
    this.elements.convertSingle.disabled = true;

    try {
      // API呼び出し（進捗コールバック付き）
      const result = await this.apiClient.convertToPdf(url, this.settings, (progress) => {
        this.updateProgress(progress.percent || 50, `${progress.message} (${progress.percent || 50}%)`);
      });

      // 成功
      this.hideProgress();
      this.showResult({
        url,
        status: 'success',
        downloadUrl: result.downloadUrl,
        fileName: result.fileName,
      });

      // PDFダウンロード
      this.downloadPdf(result.downloadUrl, result.fileName);
      
      // Analytics
      if (window.logEvent) {
        window.logEvent(window.analytics, 'conversion_success', { type: 'single' });
      }
    } catch (error) {
      // エラー
      this.hideProgress();
      this.showResult({
        url,
        status: 'error',
        error: getErrorMessage(error),
      });
      
      // Analytics
      if (window.logEvent) {
        window.logEvent(window.analytics, 'conversion_error', { type: 'single' });
      }
    } finally {
      this.elements.convertSingle.disabled = false;
    }
  }

  /**
   * バッチ変換ハンドラー
   */
  async handleBatchConversion() {
    const text = this.elements.batchUrls.value.trim();

    if (!text) {
      this.elements.batchError.textContent = 'URLを入力してください';
      return;
    }

    const urls = parseURLList(text);

    if (urls.length === 0) {
      this.elements.batchError.textContent = '有効なURLが見つかりません';
      return;
    }

    this.elements.batchError.textContent = '';

    // UI更新
    this.elements.convertBatch.disabled = true;
    this.showProgress(`0 / ${urls.length} 完了`);

    const results = [];

    // 各URLを順次処理
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];

      try {
        // API呼び出し（進捗コールバック付き）
        const result = await this.apiClient.convertToPdf(url, this.settings, (progress) => {
          const basePercent = (i / urls.length) * 100;
          const currentPercent = (progress.percent || 0) / urls.length;
          const totalPercent = Math.round(basePercent + currentPercent);
          this.updateProgress(
            totalPercent,
            `URL ${i + 1}/${urls.length}: ${progress.message} (${totalPercent}%)`
          );
        });

        results.push({
          url,
          status: 'success',
          downloadUrl: result.downloadUrl,
          fileName: result.fileName,
        });

        // PDFダウンロード
        this.downloadPdf(result.downloadUrl, result.fileName);
      } catch (error) {
        results.push({
          url,
          status: 'error',
          error: getErrorMessage(error),
        });
      }

      // 次のURLまで少し待機
      if (i < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // 完了
    this.hideProgress();
    this.showBatchResults(results);
    this.elements.convertBatch.disabled = false;
    
    // Analytics
    if (window.logEvent) {
      const successful = results.filter(r => r.status === 'success').length;
      window.logEvent(window.analytics, 'batch_conversion_complete', { 
        total: urls.length,
        successful 
      });
    }
  }

  /**
   * 設定を読み込み
   * @return {object} 設定
   */
  loadSettings() {
    try {
      const saved = localStorage.getItem('pdfSettings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('設定の読み込みに失敗:', error);
    }

    // デフォルト設定
    return {
      pageSize: 'A4',
      printBackground: true,
    };
  }

  /**
   * 設定を保存
   */
  saveSettings() {
    this.settings = {
      pageSize: this.elements.pageSize.value,
      printBackground: this.elements.printBackground.checked,
    };

    try {
      localStorage.setItem('pdfSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('設定の保存に失敗:', error);
    }
  }

  /**
   * 設定を復元
   */
  restoreSettings() {
    this.elements.pageSize.value = this.settings.pageSize;
    this.elements.printBackground.checked = this.settings.printBackground;
  }

  /**
   * 進捗表示
   * @param {string} message - ステータスメッセージ
   */
  showProgress(message) {
    this.elements.progressArea.style.display = 'block';
    this.elements.resultsArea.style.display = 'none';
    this.elements.statusMessage.textContent = message;
    this.elements.progressFill.style.width = '0%';
  }

  /**
   * 進捗更新
   * @param {number} percent - 進捗率（0-100）
   * @param {string} message - ステータスメッセージ
   */
  updateProgress(percent, message) {
    this.elements.progressFill.style.width = `${percent}%`;
    this.elements.statusMessage.textContent = message;
  }

  /**
   * 進捗非表示
   */
  hideProgress() {
    this.elements.progressArea.style.display = 'none';
  }

  /**
   * 結果表示（単一）
   * @param {object} result - 結果
   */
  showResult(result) {
    this.elements.resultsArea.style.display = 'block';
    
    const html = result.status === 'success'
      ? `<div class="result-item success">
           <span>✅ 変換成功</span>
           <a href="${result.downloadUrl}" download="${result.fileName}">ダウンロード</a>
         </div>`
      : `<div class="result-item error">
           <span>❌ ${result.error}</span>
         </div>`;

    this.elements.resultsContent.innerHTML = html;
  }

  /**
   * バッチ結果表示
   * @param {Array} results - 結果配列
   */
  showBatchResults(results) {
    this.elements.resultsArea.style.display = 'block';

    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;

    let html = `<p><strong>完了:</strong> ${successful} 成功, ${failed} 失敗</p>`;

    results.forEach(result => {
      if (result.status === 'success') {
        html += `<div class="result-item success">
                   <span>✅ ${result.url}</span>
                   <a href="${result.downloadUrl}" download="${result.fileName}">ダウンロード</a>
                 </div>`;
      } else {
        html += `<div class="result-item error">
                   <span>❌ ${result.url}</span>
                   <span>${result.error}</span>
                 </div>`;
      }
    });

    this.elements.resultsContent.innerHTML = html;
  }

  /**
   * PDFダウンロード
   * @param {string} url - ダウンロードURL
   * @param {string} fileName - ファイル名
   */
  downloadPdf(url, fileName) {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

// アプリケーション起動
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
