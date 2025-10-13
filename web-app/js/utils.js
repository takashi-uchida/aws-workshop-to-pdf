/**
 * ユーティリティ関数モジュール
 * URL検証、パース、エラーメッセージ生成、設定バリデーションを提供
 */

/**
 * URLの妥当性を検証
 * @param {string} url - 検証するURL
 * @returns {boolean} URLが有効な場合true
 */
function isValidURL(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // 空白文字を削除
  url = url.trim();

  if (url.length === 0) {
    return false;
  }

  try {
    const urlObj = new URL(url);
    // httpまたはhttpsプロトコルのみ許可
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

/**
 * テキストからURL配列を抽出
 * コメント行（#で始まる）と空行を除外
 * @param {string} text - パースするテキスト（改行区切り）
 * @returns {string[]} 有効なURL配列
 */
function parseURLList(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => {
      // 空行を除外
      if (line.length === 0) {
        return false;
      }
      // コメント行を除外
      if (line.startsWith('#')) {
        return false;
      }
      return true;
    })
    .filter(url => isValidURL(url));
}

/**
 * エラータイプに応じた日本語メッセージを生成
 * @param {Error|string} error - エラーオブジェクトまたはエラータイプ
 * @returns {string} ユーザー向けエラーメッセージ
 */
function getErrorMessage(error) {
  if (!error) {
    return '不明なエラーが発生しました。';
  }

  // 文字列の場合はエラータイプとして扱う
  if (typeof error === 'string') {
    const errorType = error.toLowerCase();

    switch (errorType) {
      case 'invalid_url':
        return '無効なURLです。正しい形式で入力してください。';
      
      case 'timeout':
        return 'ページの読み込みがタイムアウトしました。URLを確認してください。';
      
      case 'cors':
        return getCORSErrorMessage();
      
      case 'proxy_failed':
        return 'プロキシサーバーでエラーが発生しました。ページの取得に失敗した可能性があります。';
      
      case 'proxy_unavailable':
        return 'プロキシサーバーに接続できません。\n\nサーバーが起動しているか確認してください：\n\ncd web-app\nnpm install\nnpm start\n\nサーバー起動後、http://localhost:3000 でアクセスしてください。';
      
      case 'network':
        return 'ネットワークエラーが発生しました。接続を確認してください。';
      
      case 'browser_unsupported':
        return 'お使いのブラウザはこの機能をサポートしていません。Chrome、Firefox、Edgeの最新版をお使いください。';
      
      case 'load_failed':
        return 'ページの読み込みに失敗しました。URLが正しいか確認してください。';
      
      default:
        return `エラーが発生しました: ${error}`;
    }
  }

  // Errorオブジェクトの場合
  if (error instanceof Error) {
    // プロキシエラー
    if (error.name === 'ProxyError') {
      if (error.message === 'proxy_unavailable') {
        return getErrorMessage('proxy_unavailable');
      }
      const details = error.details ? `\n\n詳細: ${error.details}` : '';
      return getErrorMessage('proxy_failed') + details;
    }
    
    // CORSエラー
    if (error.name === 'CORSError' || error.message === 'cors') {
      // エラーオブジェクトにURLが含まれている場合は渡す
      const url = error.url || '';
      return getCORSErrorMessage(url);
    }

    // タイムアウトエラー
    if (error.name === 'TimeoutError' || error.message === 'timeout') {
      return getErrorMessage('timeout');
    }

    // 読み込みエラー
    if (error.name === 'LoadError' || error.message === 'load_failed') {
      return getErrorMessage('load_failed');
    }

    // ネットワークエラー
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return getErrorMessage('network');
    }

    // SecurityError（CORS関連）
    if (error.name === 'SecurityError') {
      const url = error.url || '';
      return getCORSErrorMessage(url);
    }

    // その他のエラー
    return `エラーが発生しました: ${error.message}`;
  }

  return '不明なエラーが発生しました。';
}

/**
 * AWS Workshop URLかどうかを判定
 * @param {string} url - 判定するURL
 * @returns {boolean} AWS Workshop URLの場合true
 */
function isAWSWorkshopURL(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // AWS Workshop のドメインパターン
    return hostname.includes('workshops.aws') || 
           hostname.includes('catalog.workshops.aws') ||
           (hostname.includes('catalog.') && hostname.includes('.workshops.aws'));
  } catch (error) {
    return false;
  }
}

/**
 * CORS制限の詳細なエラーメッセージを生成
 * @param {string} url - エラーが発生したURL
 * @returns {string} CORSエラーメッセージ
 */
function getCORSErrorMessage(url = '') {
  // AWS Workshop URLの場合は専用メッセージ
  if (url && isAWSWorkshopURL(url)) {
    return `AWS WorkshopのページはCLIツール版の使用を推奨します。

【理由】
ブラウザベースのツールは、セキュリティ制限により異なるドメインのページにアクセスできません。

【推奨される方法】
CLIツール版（Node.js）を使用してください：

# インストール（初回のみ）
cd aws-workshop-to-pdf
npm install

# AWS Workshopを変換
node cli.js -u "${url}" -m multi -s 'nav a[href^="/"]' --lazy-load

# または簡単なコマンド
npm run convert-workshop

詳細: プロジェクトのREADME.mdを参照

💡 CLIツールは任意のURLに対応し、複数ページの自動巡回も可能です。`;
  }

  return `このページは異なるドメインのため、ブラウザのセキュリティ制限によりアクセスできません。

【原因】
ブラウザは異なるオリジン（ドメイン）のページへの直接アクセスを制限しています。これはセキュリティ上の正常な動作です。

【このツールの制限事項】
このブラウザベースのツールは、現在表示しているページと同じドメインのページのみPDF変換できます。

【推奨される対処方法】
1. 変換したいページを別のタブで開き、ブラウザの印刷機能（Ctrl+P / Cmd+P）を使用してPDF保存
2. CLIツール版（Node.js）を使用 - 任意のURLに対応しています
   詳細: プロジェクトのREADME.mdを参照

💡 ヒント：同じドメイン内のページ（例：このツールと同じサーバー上のページ）であれば変換可能です。`;
}

/**
 * PDF設定の妥当性を検証
 * @param {Object} settings - 検証する設定オブジェクト
 * @returns {{valid: boolean, errors: string[]}} 検証結果
 */
function validateSettings(settings) {
  const errors = [];

  if (!settings || typeof settings !== 'object') {
    return {
      valid: false,
      errors: ['設定が無効です。']
    };
  }

  // ページサイズの検証
  const validPageSizes = ['A4', 'Letter', 'Legal'];
  if (settings.pageSize && !validPageSizes.includes(settings.pageSize)) {
    errors.push(`無効なページサイズです。有効な値: ${validPageSizes.join(', ')}`);
  }

  // 向きの検証
  const validOrientations = ['portrait', 'landscape'];
  if (settings.orientation && !validOrientations.includes(settings.orientation)) {
    errors.push(`無効な向きです。有効な値: ${validOrientations.join(', ')}`);
  }

  // 余白の検証
  if (settings.margins) {
    const marginKeys = ['top', 'right', 'bottom', 'left'];
    const marginRegex = /^\d+(\.\d+)?(cm|mm|in|px)$/;

    for (const key of marginKeys) {
      if (settings.margins[key] && !marginRegex.test(settings.margins[key])) {
        errors.push(`無効な余白設定です (${key}): 数値と単位を指定してください（例: 1cm, 10mm）`);
      }
    }
  }

  // スケールの検証
  if (settings.scale !== undefined) {
    const scale = parseFloat(settings.scale);
    if (isNaN(scale) || scale < 0.1 || scale > 2.0) {
      errors.push('スケールは0.1から2.0の範囲で指定してください。');
    }
  }

  // 背景印刷の検証
  if (settings.printBackground !== undefined && typeof settings.printBackground !== 'boolean') {
    errors.push('背景印刷設定はtrueまたはfalseで指定してください。');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * ブラウザの互換性をチェック
 * @returns {{compatible: boolean, unsupportedFeatures: string[], warnings: string[]}} チェック結果
 */
function checkBrowserCompatibility() {
  const unsupportedFeatures = [];
  const warnings = [];

  // iframe サポートチェック
  try {
    const iframe = document.createElement('iframe');
    if (typeof iframe === 'undefined' || !iframe) {
      unsupportedFeatures.push('iframe');
    }
  } catch (error) {
    unsupportedFeatures.push('iframe');
  }

  // localStorage サポートチェック
  try {
    if (typeof localStorage === 'undefined') {
      unsupportedFeatures.push('localStorage');
    } else {
      // 実際に書き込みテスト
      const testKey = '__browser_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
    }
  } catch (error) {
    unsupportedFeatures.push('localStorage');
    warnings.push('localStorageが無効になっています。設定が保存されません。');
  }

  // print API サポートチェック
  if (typeof window.print === 'undefined') {
    unsupportedFeatures.push('print');
  }

  // Blob サポートチェック（PDF生成に必要）
  if (typeof Blob === 'undefined') {
    unsupportedFeatures.push('Blob');
  }

  // URL API サポートチェック
  try {
    new URL('https://example.com');
  } catch (error) {
    unsupportedFeatures.push('URL API');
  }

  // Promise サポートチェック
  if (typeof Promise === 'undefined') {
    unsupportedFeatures.push('Promise');
  }

  // Fetch API サポートチェック
  if (typeof fetch === 'undefined') {
    warnings.push('Fetch APIがサポートされていません。一部の機能が制限される可能性があります。');
  }

  return {
    compatible: unsupportedFeatures.length === 0,
    unsupportedFeatures,
    warnings
  };
}

/**
 * ブラウザ情報を取得
 * @returns {{name: string, version: string, os: string}} ブラウザ情報
 */
function getBrowserInfo() {
  const ua = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';
  let os = 'Unknown';

  // ブラウザ名とバージョンを検出
  if (ua.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
    const match = ua.match(/Firefox\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (ua.indexOf('Edg') > -1) {
    browserName = 'Edge';
    const match = ua.match(/Edg\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (ua.indexOf('Chrome') > -1) {
    browserName = 'Chrome';
    const match = ua.match(/Chrome\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (ua.indexOf('Safari') > -1) {
    browserName = 'Safari';
    const match = ua.match(/Version\/(\d+)/);
    if (match) browserVersion = match[1];
  }

  // OS を検出
  if (ua.indexOf('Windows') > -1) {
    os = 'Windows';
  } else if (ua.indexOf('Mac') > -1) {
    os = 'macOS';
  } else if (ua.indexOf('Linux') > -1) {
    os = 'Linux';
  } else if (ua.indexOf('Android') > -1) {
    os = 'Android';
  } else if (ua.indexOf('iOS') > -1 || ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) {
    os = 'iOS';
  }

  return {
    name: browserName,
    version: browserVersion,
    os
  };
}

/**
 * ブラウザが推奨環境かチェック
 * @returns {{recommended: boolean, message: string}} チェック結果
 */
function isRecommendedBrowser() {
  const browserInfo = getBrowserInfo();
  const minVersions = {
    Chrome: 90,
    Firefox: 88,
    Edge: 90,
    Safari: 14
  };

  const minVersion = minVersions[browserInfo.name];
  if (!minVersion) {
    return {
      recommended: false,
      message: `${browserInfo.name}は推奨ブラウザではありません。Chrome、Firefox、Edge、Safariの最新版をご利用ください。`
    };
  }

  const version = parseInt(browserInfo.version, 10);
  if (isNaN(version) || version < minVersion) {
    return {
      recommended: false,
      message: `${browserInfo.name}のバージョンが古い可能性があります。最新版へのアップデートを推奨します。`
    };
  }

  return {
    recommended: true,
    message: ''
  };
}

/**
 * トースト通知を表示
 * @param {string} message - 表示するメッセージ
 * @param {string} type - トーストタイプ ('success', 'error', 'warning', 'info')
 * @param {number} duration - 表示時間（ミリ秒）、0で自動非表示なし
 */
function showToast(message, type = 'info', duration = 5000) {
  const container = document.getElementById('toast-container');
  if (!container) {
    console.error('トーストコンテナが見つかりません');
    return;
  }

  // トースト要素を作成
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');

  // アイコンを決定
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  // タイトルを決定
  const titles = {
    success: '成功',
    error: 'エラー',
    warning: '警告',
    info: '情報'
  };

  // トースト内容を構築
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-content">
      <div class="toast-title">${titles[type] || titles.info}</div>
      <div class="toast-message">${escapeHtml(message)}</div>
    </div>
    <button class="toast-close" aria-label="閉じる">×</button>
  `;

  // 閉じるボタンのイベントリスナー
  const closeButton = toast.querySelector('.toast-close');
  closeButton.addEventListener('click', () => {
    removeToast(toast);
  });

  // コンテナに追加
  container.appendChild(toast);

  // 自動削除（durationが0より大きい場合）
  if (duration > 0) {
    setTimeout(() => {
      removeToast(toast);
    }, duration);
  }

  return toast;
}

/**
 * トーストを削除
 * @param {HTMLElement} toast - 削除するトースト要素
 */
function removeToast(toast) {
  if (!toast || !toast.parentElement) {
    return;
  }

  // 終了アニメーションを追加
  toast.classList.add('toast-exit');

  // アニメーション終了後に削除
  setTimeout(() => {
    if (toast.parentElement) {
      toast.parentElement.removeChild(toast);
    }
  }, 300);
}

/**
 * インラインエラーメッセージを表示
 * @param {string} elementId - エラーメッセージを表示する要素のID
 * @param {string} message - エラーメッセージ
 * @param {string} type - メッセージタイプ ('error', 'warning', 'info')
 */
function showInlineMessage(elementId, message, type = 'error') {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`要素が見つかりません: ${elementId}`);
    return;
  }

  // 既存のメッセージをクリア
  element.className = `inline-${type}`;
  element.setAttribute('role', 'alert');

  // アイコンを決定
  const icons = {
    error: '⚠️',
    warning: '⚠️',
    info: 'ℹ️'
  };

  // メッセージを設定
  element.innerHTML = `
    <span class="inline-${type}-icon">${icons[type] || icons.error}</span>
    <span class="inline-${type}-message">${escapeHtml(message)}</span>
  `;

  // 表示
  element.classList.add('show');
}

/**
 * インラインメッセージを非表示
 * @param {string} elementId - 非表示にする要素のID
 */
function hideInlineMessage(elementId) {
  const element = document.getElementById(elementId);
  if (!element) {
    return;
  }

  element.classList.remove('show');
  element.innerHTML = '';
}

/**
 * HTMLエスケープ
 * @param {string} text - エスケープするテキスト
 * @returns {string} エスケープされたテキスト
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * エラーメッセージを表示（トーストとインラインの両方に対応）
 * @param {Error|string} error - エラーオブジェクトまたはエラータイプ
 * @param {Object} options - 表示オプション
 * @param {boolean} options.showToast - トースト通知を表示するか
 * @param {string} options.inlineElementId - インラインメッセージを表示する要素のID
 */
function displayError(error, options = {}) {
  const { showToast: shouldShowToast = true, inlineElementId = null } = options;
  const message = getErrorMessage(error);

  if (shouldShowToast) {
    showToast(message, 'error');
  }

  if (inlineElementId) {
    showInlineMessage(inlineElementId, message, 'error');
  }
}

/**
 * 成功メッセージを表示
 * @param {string} message - 成功メッセージ
 * @param {Object} options - 表示オプション
 */
function displaySuccess(message, options = {}) {
  const { showToast: shouldShowToast = true, inlineElementId = null } = options;

  if (shouldShowToast) {
    showToast(message, 'success');
  }

  if (inlineElementId) {
    showInlineMessage(inlineElementId, message, 'info');
  }
}

/**
 * 警告メッセージを表示
 * @param {string} message - 警告メッセージ
 * @param {Object} options - 表示オプション
 */
function displayWarning(message, options = {}) {
  const { showToast: shouldShowToast = true, inlineElementId = null } = options;

  if (shouldShowToast) {
    showToast(message, 'warning');
  }

  if (inlineElementId) {
    showInlineMessage(inlineElementId, message, 'warning');
  }
}

// モジュールのエクスポート（ブラウザ環境用）
if (typeof window !== 'undefined') {
  window.Utils = {
    isValidURL,
    parseURLList,
    getErrorMessage,
    validateSettings,
    checkBrowserCompatibility,
    getBrowserInfo,
    isRecommendedBrowser,
    isAWSWorkshopURL,
    showToast,
    removeToast,
    showInlineMessage,
    hideInlineMessage,
    escapeHtml,
    displayError,
    displaySuccess,
    displayWarning
  };
}

// Node.js環境用のエクスポート（テスト用）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isValidURL,
    parseURLList,
    getErrorMessage,
    validateSettings,
    checkBrowserCompatibility,
    getBrowserInfo,
    isRecommendedBrowser,
    isAWSWorkshopURL,
    showToast,
    removeToast,
    showInlineMessage,
    hideInlineMessage,
    escapeHtml,
    displayError,
    displaySuccess,
    displayWarning
  };
}
