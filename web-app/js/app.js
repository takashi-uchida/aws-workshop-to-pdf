/**
 * App クラス
 * アプリケーションのメインコントローラー
 * UI管理、イベントハンドリング、設定管理を担当
 */
class App {
  /**
   * コンストラクタ
   * PDFConverterとBatchProcessorのインスタンスを初期化
   */
  constructor() {
    // PDFConverterのインスタンス化
    this.converter = new PDFConverter();
    
    // BatchProcessorのインスタンス化
    this.batchProcessor = new BatchProcessor(this.converter);
    
    // 設定を読み込み
    this.settings = this.loadSettings();
    
    // DOM要素の参照を保持
    this.elements = {};
    
    // 現在のモード（'single' または 'batch'）
    this.currentMode = 'single';
  }

  /**
   * デフォルト設定を取得
   * @returns {Object} デフォルト設定
   */
  getDefaultSettings() {
    return {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      },
      scale: 1.0,
      printBackground: true
    };
  }

  /**
   * localStorageから設定を読み込み
   * @returns {Object} 読み込んだ設定（存在しない場合はデフォルト設定）
   */
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('pdfConverterSettings');
      
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        // デフォルト設定とマージ（新しい設定項目が追加された場合に対応）
        return { ...this.getDefaultSettings(), ...parsed };
      }
    } catch (error) {
      console.error('設定の読み込みに失敗しました:', error);
    }
    
    return this.getDefaultSettings();
  }

  /**
   * localStorageに設定を保存
   * @param {Object} settings - 保存する設定
   */
  saveSettings(settings) {
    try {
      // 設定のバリデーション
      const validation = Utils.validateSettings(settings);
      
      if (!validation.valid) {
        console.error('設定の検証に失敗しました:', validation.errors);
        return false;
      }
      
      // localStorageに保存
      localStorage.setItem('pdfConverterSettings', JSON.stringify(settings));
      this.settings = settings;
      
      return true;
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
      return false;
    }
  }

  /**
   * アプリケーションを初期化
   * DOM要素の取得、イベントリスナーの設定、初期状態の設定
   */
  init() {
    // DOM要素の取得と保存
    this.elements = {
      // モード切り替えタブ
      singleTab: document.getElementById('single-mode-tab'),
      batchTab: document.getElementById('batch-mode-tab'),
      
      // 単一URL入力
      singleUrlInput: document.getElementById('single-url-input'),
      singleConvertBtn: document.getElementById('single-convert-btn'),
      singleSection: document.getElementById('single-mode'),
      
      // バッチURL入力
      batchUrlInput: document.getElementById('batch-url-input'),
      batchConvertBtn: document.getElementById('batch-convert-btn'),
      batchSection: document.getElementById('batch-mode'),
      urlCount: document.getElementById('url-count'),
      
      // 設定パネル
      pageSizeSelect: document.getElementById('page-size'),
      orientationSelect: document.getElementById('orientation'),
      marginTop: document.getElementById('margin-top'),
      marginRight: document.getElementById('margin-right'),
      marginBottom: document.getElementById('margin-bottom'),
      marginLeft: document.getElementById('margin-left'),
      printBackgroundCheckbox: document.getElementById('print-background'),
      
      // 進捗・結果表示
      progressSection: document.getElementById('progress-section'),
      progressBar: document.getElementById('progress-bar'),
      progressMessage: document.getElementById('progress-message'),
      progressDetails: document.getElementById('progress-details'),
      resultsSection: document.getElementById('results-section'),
      resultsContent: document.getElementById('results-content')
    };
    
    // イベントリスナーの設定
    this.setupEventListeners();
    
    // 初期状態の設定
    this.setupInitialState();
    
    // ブラウザ互換性チェック
    this.checkBrowserCompatibility();
  }

  /**
   * イベントリスナーを設定
   */
  setupEventListeners() {
    // モード切り替えタブ
    if (this.elements.singleTab) {
      this.elements.singleTab.addEventListener('click', () => this.switchMode('single'));
      // キーボードナビゲーション（矢印キー）
      this.elements.singleTab.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.switchMode('batch');
          this.elements.batchTab?.focus();
        }
      });
    }
    if (this.elements.batchTab) {
      this.elements.batchTab.addEventListener('click', () => this.switchMode('batch'));
      // キーボードナビゲーション（矢印キー）
      this.elements.batchTab.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.switchMode('single');
          this.elements.singleTab?.focus();
        }
      });
    }
    
    // 単一URL変換
    if (this.elements.singleConvertBtn) {
      this.elements.singleConvertBtn.addEventListener('click', () => this.handleSingleConversion());
    }
    if (this.elements.singleUrlInput) {
      this.elements.singleUrlInput.addEventListener('input', () => this.validateSingleUrl());
      // Enterキーで変換を実行
      this.elements.singleUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleSingleConversion();
        }
      });
    }
    
    // バッチ変換
    if (this.elements.batchConvertBtn) {
      this.elements.batchConvertBtn.addEventListener('click', () => this.handleBatchConversion());
    }
    if (this.elements.batchUrlInput) {
      this.elements.batchUrlInput.addEventListener('input', () => this.updateUrlCount());
    }
    
    // 設定変更イベント
    this.setupSettingsListeners();
  }

  /**
   * 設定変更イベントリスナーを設定
   */
  setupSettingsListeners() {
    const settingsElements = [
      this.elements.pageSizeSelect,
      this.elements.orientationSelect,
      this.elements.marginTop,
      this.elements.marginRight,
      this.elements.marginBottom,
      this.elements.marginLeft,
      this.elements.printBackgroundCheckbox
    ];
    
    settingsElements.forEach(element => {
      if (element) {
        element.addEventListener('change', () => this.handleSettingsChange());
      }
    });
  }

  /**
   * 初期状態を設定
   */
  setupInitialState() {
    // 設定をUIに反映
    this.applySettingsToUI();
    
    // 単一URLモードを初期表示
    this.switchMode('single');
    
    // 進捗・結果エリアを非表示
    this.hideProgress();
    this.hideResult();
  }

  /**
   * 保存された設定をUIに反映
   */
  applySettingsToUI() {
    if (this.elements.pageSizeSelect) {
      this.elements.pageSizeSelect.value = this.settings.pageSize;
    }
    if (this.elements.orientationSelect) {
      this.elements.orientationSelect.value = this.settings.orientation;
    }
    if (this.elements.marginTop) {
      this.elements.marginTop.value = this.settings.margins.top;
    }
    if (this.elements.marginRight) {
      this.elements.marginRight.value = this.settings.margins.right;
    }
    if (this.elements.marginBottom) {
      this.elements.marginBottom.value = this.settings.margins.bottom;
    }
    if (this.elements.marginLeft) {
      this.elements.marginLeft.value = this.settings.margins.left;
    }
    if (this.elements.printBackgroundCheckbox) {
      this.elements.printBackgroundCheckbox.checked = this.settings.printBackground;
    }
  }

  /**
   * モードを切り替え（単一URL/バッチ）
   * @param {string} mode - 'single' または 'batch'
   */
  switchMode(mode) {
    this.currentMode = mode;
    
    if (mode === 'single') {
      // 単一URLモードを表示
      if (this.elements.singleSection) {
        this.elements.singleSection.style.display = 'block';
      }
      if (this.elements.batchSection) {
        this.elements.batchSection.style.display = 'none';
      }
      
      // タブのアクティブ状態を更新
      if (this.elements.singleTab) {
        this.elements.singleTab.classList.add('active');
      }
      if (this.elements.batchTab) {
        this.elements.batchTab.classList.remove('active');
      }
    } else {
      // バッチモードを表示
      if (this.elements.singleSection) {
        this.elements.singleSection.style.display = 'none';
      }
      if (this.elements.batchSection) {
        this.elements.batchSection.style.display = 'block';
      }
      
      // タブのアクティブ状態を更新
      if (this.elements.singleTab) {
        this.elements.singleTab.classList.remove('active');
      }
      if (this.elements.batchTab) {
        this.elements.batchTab.classList.add('active');
      }
    }
    
    // 進捗・結果をクリア
    this.hideProgress();
    this.hideResult();
  }



  /**
   * 単一URLの検証
   */
  validateSingleUrl() {
    const url = this.elements.singleUrlInput?.value.trim();
    const isValid = Utils.isValidURL(url);
    
    // インラインエラーメッセージをクリア
    if (isValid || !url) {
      Utils.hideInlineMessage('single-url-error');
    } else if (url) {
      // 無効なURLの場合はインラインエラーを表示
      Utils.showInlineMessage('single-url-error', '無効なURLです。正しい形式で入力してください。', 'error');
    }
    
    if (this.elements.singleConvertBtn) {
      this.elements.singleConvertBtn.disabled = !isValid;
    }
    
    return isValid;
  }

  /**
   * URL数カウンターを更新
   */
  updateUrlCount() {
    if (!this.elements.batchUrlInput || !this.elements.urlCount) {
      return;
    }
    
    const text = this.elements.batchUrlInput.value;
    const urls = Utils.parseURLList(text);
    
    this.elements.urlCount.textContent = `${urls.length}個のURL`;
    
    // バッチ変換ボタンの有効/無効を切り替え
    if (this.elements.batchConvertBtn) {
      this.elements.batchConvertBtn.disabled = urls.length === 0;
    }
  }

  /**
   * 設定変更を処理
   */
  handleSettingsChange() {
    // UIから設定を読み取り
    const newSettings = {
      pageSize: this.elements.pageSizeSelect?.value || 'A4',
      orientation: this.elements.orientationSelect?.value || 'portrait',
      margins: {
        top: this.elements.marginTop?.value || '1cm',
        right: this.elements.marginRight?.value || '1cm',
        bottom: this.elements.marginBottom?.value || '1cm',
        left: this.elements.marginLeft?.value || '1cm'
      },
      scale: 1.0,
      printBackground: this.elements.printBackgroundCheckbox?.checked ?? true
    };
    
    // 設定を保存
    this.saveSettings(newSettings);
  }

  /**
   * ブラウザ互換性をチェック
   */
  checkBrowserCompatibility() {
    // 互換性チェックを実行
    const compatibilityResult = Utils.checkBrowserCompatibility();
    
    // 非対応機能がある場合
    if (!compatibilityResult.compatible) {
      const features = compatibilityResult.unsupportedFeatures.join(', ');
      const message = `お使いのブラウザは一部の機能をサポートしていません（${features}）。Chrome、Firefox、Edge、Safariの最新版をご利用ください。`;
      
      // エラートーストを表示
      Utils.showToast(message, 'error', 0); // 自動非表示なし
      
      // 変換ボタンを無効化
      if (this.elements.singleConvertBtn) {
        this.elements.singleConvertBtn.disabled = true;
      }
      if (this.elements.batchConvertBtn) {
        this.elements.batchConvertBtn.disabled = true;
      }
      
      return false;
    }
    
    // 警告がある場合
    if (compatibilityResult.warnings.length > 0) {
      compatibilityResult.warnings.forEach(warning => {
        Utils.showToast(warning, 'warning', 8000);
      });
    }
    
    // 推奨ブラウザチェック
    const recommendedCheck = Utils.isRecommendedBrowser();
    if (!recommendedCheck.recommended) {
      Utils.showToast(recommendedCheck.message, 'warning', 10000);
    }
    
    return true;
  }

  /**
   * 進捗表示を表示
   */
  showProgress() {
    if (this.elements.progressSection) {
      this.elements.progressSection.hidden = false;
    }
  }

  /**
   * 進捗表示を非表示
   */
  hideProgress() {
    if (this.elements.progressSection) {
      this.elements.progressSection.hidden = true;
    }
  }

  /**
   * 結果表示を表示
   */
  showResult() {
    if (this.elements.resultsSection) {
      this.elements.resultsSection.hidden = false;
    }
  }

  /**
   * 結果表示を非表示
   */
  hideResult() {
    if (this.elements.resultsSection) {
      this.elements.resultsSection.hidden = true;
    }
  }

  /**
   * 進捗テキストを更新
   * @param {string} text - 表示するテキスト
   */
  updateProgressText(text) {
    if (this.elements.progressMessage) {
      this.elements.progressMessage.textContent = text;
    }
  }

  /**
   * 進捗バーを更新
   * @param {number} current - 現在の進捗
   * @param {number} total - 全体の数
   */
  updateProgressBar(current, total) {
    if (this.elements.progressBar) {
      const percentage = (current / total) * 100;
      this.elements.progressBar.style.width = `${percentage}%`;
    }
  }

  /**
   * 結果メッセージを表示
   * @param {string} message - 表示するメッセージ
   * @param {string} type - メッセージタイプ（'success', 'error', 'info'）
   */
  showResultMessage(message, type = 'info') {
    if (this.elements.resultsContent) {
      this.elements.resultsContent.innerHTML = `<div class="result-message ${type}">${message}</div>`;
    }
    this.showResult();
  }

  /**
   * エラーメッセージを表示
   * @param {string} message - エラーメッセージ
   * @param {Object} options - 表示オプション
   */
  showError(message, options = {}) {
    const { showToast = true, showInline = false, inlineElementId = null } = options;
    
    if (showToast) {
      Utils.showToast(message, 'error');
    }
    
    if (showInline && inlineElementId) {
      Utils.showInlineMessage(inlineElementId, message, 'error');
    }
    
    // 結果エリアにも表示
    this.showResultMessage(message, 'error');
  }

  /**
   * 成功メッセージを表示
   * @param {string} message - 成功メッセージ
   * @param {Object} options - 表示オプション
   */
  showSuccess(message, options = {}) {
    const { showToast = true } = options;
    
    if (showToast) {
      Utils.showToast(message, 'success');
    }
    
    // 結果エリアにも表示
    this.showResultMessage(message, 'success');
  }

  /**
   * 警告メッセージを表示
   * @param {string} message - 警告メッセージ
   * @param {Object} options - 表示オプション
   */
  showWarning(message, options = {}) {
    const { showToast = true } = options;
    
    if (showToast) {
      Utils.showToast(message, 'warning');
    }
    
    // 結果エリアにも表示
    this.showResultMessage(message, 'warning');
  }

  /**
   * 単一URL変換を処理
   */
  async handleSingleConversion() {
    // URL検証
    if (!this.validateSingleUrl()) {
      this.showError(Utils.getErrorMessage('invalid_url'), {
        showInline: true,
        inlineElementId: 'single-url-error'
      });
      return;
    }
    
    const url = this.elements.singleUrlInput.value.trim();
    
    // インラインエラーをクリア
    Utils.hideInlineMessage('single-url-error');
    
    // AWS Workshop URLの場合は警告を表示（処理は続行）
    if (Utils.isAWSWorkshopURL(url)) {
      this.showWarning('AWS WorkshopのURLが検出されました。ブラウザの制限により変換できない場合は、CLIツール版の使用を推奨します。', { showToast: true });
    }
    
    // 進捗表示
    this.hideResult();
    this.showProgress();
    this.updateProgressText('変換中...');
    
    // 変換ボタンを無効化
    if (this.elements.singleConvertBtn) {
      this.elements.singleConvertBtn.disabled = true;
    }
    
    try {
      // PDF変換を実行
      await this.converter.convertToPDF(url, this.settings);
      
      // 成功メッセージを表示
      this.hideProgress();
      this.showSuccess('印刷ダイアログが表示されました。PDFとして保存してください。');
    } catch (error) {
      // エラーメッセージを表示
      this.hideProgress();
      this.showError(Utils.getErrorMessage(error), {
        showInline: true,
        inlineElementId: 'single-url-error'
      });
    } finally {
      // 変換ボタンを有効化
      if (this.elements.singleConvertBtn) {
        this.elements.singleConvertBtn.disabled = false;
      }
    }
  }

  /**
   * バッチ変換を処理
   */
  async handleBatchConversion() {
    // URL配列を取得
    const text = this.elements.batchUrlInput?.value || '';
    const urls = Utils.parseURLList(text);
    
    if (urls.length === 0) {
      this.showError('有効なURLが入力されていません。', {
        showInline: true,
        inlineElementId: 'batch-url-error'
      });
      return;
    }
    
    // インラインエラーをクリア
    Utils.hideInlineMessage('batch-url-error');
    
    // 進捗表示
    this.hideResult();
    this.showProgress();
    this.updateProgressText(`0 / ${urls.length} 処理中...`);
    this.updateProgressBar(0, urls.length);
    
    // バッチ変換ボタンを無効化
    if (this.elements.batchConvertBtn) {
      this.elements.batchConvertBtn.disabled = true;
    }
    
    try {
      // バッチ処理を実行
      const results = await this.batchProcessor.processBatch(
        urls,
        this.settings,
        (progress) => {
          // 進捗コールバック
          this.updateProgressText(`${progress.current} / ${progress.total} 処理中...`);
          this.updateProgressBar(progress.current, progress.total);
        }
      );
      
      // 結果サマリーを表示
      this.hideProgress();
      const message = `
バッチ処理が完了しました。
成功: ${results.successful} / ${results.total}
失敗: ${results.failed} / ${results.total}
      `.trim();
      
      if (results.failed > 0) {
        this.showWarning(message);
      } else {
        this.showSuccess(message);
      }
    } catch (error) {
      // エラーメッセージを表示
      this.hideProgress();
      this.showError(Utils.getErrorMessage(error), {
        showInline: true,
        inlineElementId: 'batch-url-error'
      });
    } finally {
      // バッチ変換ボタンを有効化
      if (this.elements.batchConvertBtn) {
        this.elements.batchConvertBtn.disabled = false;
      }
    }
  }
}

/**
 * モーダル管理クラス
 * モーダルの開閉とアクセシビリティを管理
 */
class ModalManager {
  constructor() {
    this.modals = new Map();
    this.init();
  }

  /**
   * モーダルマネージャーを初期化
   */
  init() {
    // すべてのモーダルを取得
    document.querySelectorAll('.modal').forEach(modal => {
      const modalId = modal.id;
      this.modals.set(modalId, modal);
    });

    // モーダルを開くトリガーのイベントリスナー
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-open-modal]');
      if (trigger) {
        e.preventDefault();
        const modalId = trigger.getAttribute('data-open-modal');
        this.openModal(modalId);
      }
    });

    // モーダルを閉じるトリガーのイベントリスナー
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-close-modal]');
      if (trigger) {
        e.preventDefault();
        const modalId = trigger.getAttribute('data-close-modal');
        this.closeModal(modalId);
      }
    });

    // Escapeキーでモーダルを閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
  }

  /**
   * モーダルを開く
   * @param {string} modalId - モーダルのID
   */
  openModal(modalId) {
    const modal = this.modals.get(modalId);
    if (!modal) {
      console.error(`モーダルが見つかりません: ${modalId}`);
      return;
    }

    // モーダルを表示
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');

    // フォーカスをモーダル内に移動
    const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
      setTimeout(() => firstFocusable.focus(), 100);
    }

    // bodyのスクロールを無効化
    document.body.style.overflow = 'hidden';
  }

  /**
   * モーダルを閉じる
   * @param {string} modalId - モーダルのID
   */
  closeModal(modalId) {
    const modal = this.modals.get(modalId);
    if (!modal) {
      return;
    }

    // モーダルを非表示
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');

    // bodyのスクロールを有効化（他のモーダルが開いていない場合）
    const hasOpenModal = Array.from(this.modals.values()).some(m => m.classList.contains('show'));
    if (!hasOpenModal) {
      document.body.style.overflow = '';
    }
  }

  /**
   * すべてのモーダルを閉じる
   */
  closeAllModals() {
    this.modals.forEach((modal, modalId) => {
      this.closeModal(modalId);
    });
  }
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();

  // モーダルマネージャーを初期化
  const modalManager = new ModalManager();
});
