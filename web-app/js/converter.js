/**
 * PDFConverter クラス
 * ブラウザのネイティブ印刷機能を使用してWebページをPDFに変換
 */
class PDFConverter {
  /**
   * コンストラクタ
   */
  constructor() {
    this.iframe = null;
    this.currentSettings = {
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
    this.proxyUrl = '/api/fetch-page';
  }

  /**
   * URLをPDFに変換
   * @param {string} url - 変換するURL
   * @param {Object} settings - PDF設定
   * @returns {Promise<void>}
   */
  async convertToPDF(url, settings = {}) {
    // 設定をマージ
    this.currentSettings = { ...this.currentSettings, ...settings };
    this.currentUrl = url;
    
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        // 1. iframeを作成（まず直接読み込みを試みる）
        const iframe = this.createIframe(url);
        
        // 2. 読み込み完了を待機
        await this.waitForLoad(iframe);
        
        // 3. 印刷ダイアログをトリガー
        this.triggerPrint(iframe);
        
        // 4. 少し待ってからクリーンアップ（印刷ダイアログが表示されるまで）
        setTimeout(() => {
          this.cleanup();
        }, 2000);
        
        return;
      } catch (error) {
        // クリーンアップ
        this.cleanup();
        
        retryCount++;
        
        // 最後の試行でもエラーの場合は例外を投げる
        if (retryCount >= maxRetries) {
          // URLをエラーオブジェクトに追加
          error.url = url;
          throw error;
        }
        
        // リトライ前に少し待機
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * iframeを作成してDOMに追加
   * @param {string} url - 読み込むURL
   * @returns {HTMLIFrameElement}
   */
  createIframe(url) {
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '1024px';
    iframe.style.height = '768px';
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);
    this.iframe = iframe;
    
    return iframe;
  }

  /**
   * iframeの読み込み完了を待機
   * @param {HTMLIFrameElement} iframe - 対象のiframe
   * @param {number} timeout - タイムアウト時間（ミリ秒）
   * @returns {Promise<void>}
   */
  waitForLoad(iframe, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const error = new Error('timeout');
        error.name = 'TimeoutError';
        reject(error);
      }, timeout);

      iframe.addEventListener('load', () => {
        clearTimeout(timeoutId);
        
        // CORS制限のチェック
        try {
          // iframeのコンテンツにアクセスを試みる
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          
          if (!doc) {
            // アクセスできない場合はCORS制限の可能性
            const error = new Error('cors');
            error.name = 'CORSError';
            error.url = this.currentUrl;
            reject(error);
            return;
          }
          
          // 追加の待機時間（動的コンテンツの読み込みを待つ）
          setTimeout(() => {
            resolve();
          }, 1000);
        } catch (error) {
          // SecurityErrorの場合はCORS制限
          if (error.name === 'SecurityError') {
            const corsError = new Error('cors');
            corsError.name = 'CORSError';
            corsError.url = this.currentUrl;
            reject(corsError);
          } else {
            reject(error);
          }
        }
      });

      iframe.addEventListener('error', () => {
        clearTimeout(timeoutId);
        const error = new Error('load_failed');
        error.name = 'LoadError';
        reject(error);
      });
    });
  }

  /**
   * 印刷ダイアログをトリガー
   * @param {HTMLIFrameElement} iframe - 対象のiframe
   */
  triggerPrint(iframe) {
    try {
      // iframeのwindowオブジェクトにアクセスして印刷
      if (!iframe.contentWindow) {
        const error = new Error('cors');
        error.name = 'CORSError';
        error.url = this.currentUrl;
        throw error;
      }
      
      // コンテンツへのアクセスを試みる
      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        if (!doc) {
          const error = new Error('cors');
          error.name = 'CORSError';
          error.url = this.currentUrl;
          throw error;
        }
      } catch (accessError) {
        if (accessError.name === 'SecurityError') {
          const error = new Error('cors');
          error.name = 'CORSError';
          error.url = this.currentUrl;
          throw error;
        }
      }
      
      // 印刷を実行
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (error) {
      // CORS制限の場合
      if (error.name === 'CORSError' || error.name === 'SecurityError') {
        const corsError = new Error('cors');
        corsError.name = 'CORSError';
        corsError.url = this.currentUrl;
        throw corsError;
      }
      throw error;
    }
  }

  /**
   * 同一オリジンかチェック
   * @param {string} url - チェックするURL
   * @returns {boolean}
   */
  isSameOrigin(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.origin === window.location.origin;
    } catch (error) {
      return false;
    }
  }

  /**
   * プロキシ経由でiframeを作成
   * @param {string} url - 読み込むURL
   * @returns {Promise<HTMLIFrameElement>}
   */
  async createIframeViaProxy(url) {
    try {
      // プロキシサーバーからHTMLを取得
      const response = await fetch(this.proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error('proxy_failed');
        error.name = 'ProxyError';
        error.url = this.currentUrl;
        error.details = errorData.error || `HTTP ${response.status}`;
        throw error;
      }

      const data = await response.json();
      
      // HTMLをBlobとして作成
      const blob = new Blob([data.html], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);

      // iframeを作成
      const iframe = document.createElement('iframe');
      iframe.src = blobUrl;
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.top = '-9999px';
      iframe.style.width = '1024px';
      iframe.style.height = '768px';
      iframe.style.border = 'none';
      
      document.body.appendChild(iframe);
      this.iframe = iframe;
      
      return iframe;
    } catch (error) {
      if (error.name === 'ProxyError') {
        throw error;
      }
      
      // プロキシサーバーに接続できない場合
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        const proxyError = new Error('proxy_unavailable');
        proxyError.name = 'ProxyError';
        proxyError.url = this.currentUrl;
        throw proxyError;
      }
      
      // その他のエラーはCORSエラーとして扱う
      const corsError = new Error('cors');
      corsError.name = 'CORSError';
      corsError.url = this.currentUrl;
      throw corsError;
    }
  }

  /**
   * iframeをクリーンアップ
   */
  cleanup() {
    if (this.iframe && this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
      this.iframe = null;
    }
  }
}
