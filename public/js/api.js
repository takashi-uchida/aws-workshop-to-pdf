/**
 * API Client
 * Firebase Functionsとの通信を管理
 */
class ApiClient {
  // クラス定数
  static FIREBASE_REGION = 'us-central1';
  static FIREBASE_PROJECT_ID = 'aws-workshop-to-pdf';
  static LOCAL_HOST = 'localhost';
  static LOCAL_PORT = '5001';
  static DEFAULT_TIMEOUT = 320000; // 320秒
  static MAX_RETRIES = 3;
  static RETRY_DELAY = 1000; // 1秒

  constructor() {
    this.baseUrl = this.buildBaseUrl();
  }

  /**
   * 環境に応じたベースURLを構築
   * @returns {string} ベースURL
   */
  buildBaseUrl() {
    const isLocal = window.location.hostname === ApiClient.LOCAL_HOST;
    
    if (isLocal) {
      return `http://${ApiClient.LOCAL_HOST}:${ApiClient.LOCAL_PORT}/${ApiClient.FIREBASE_PROJECT_ID}/${ApiClient.FIREBASE_REGION}`;
    }
    
    return `https://${ApiClient.FIREBASE_REGION}-${ApiClient.FIREBASE_PROJECT_ID}.cloudfunctions.net`;
  }

  /**
   * タイムアウト付きfetch
   * @param {string} url - リクエストURL
   * @param {Object} options - fetchオプション
   * @param {number} timeout - タイムアウト時間（ミリ秒）
   * @returns {Promise<Response>}
   */
  async fetchWithTimeout(url, options = {}, timeout = ApiClient.DEFAULT_TIMEOUT) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        const timeoutError = new Error('リクエストがタイムアウトしました。処理に時間がかかりすぎています。');
        timeoutError.name = 'TimeoutError';
        throw timeoutError;
      }
      throw error;
    }
  }

  /**
   * リトライ付きでAPIを呼び出し
   * @param {Function} fn - 実行する関数
   * @param {number} maxRetries - 最大リトライ回数
   * @param {number} delay - リトライ間隔（ミリ秒）
   * @returns {Promise<any>}
   */
  async retryWithBackoff(fn, maxRetries = ApiClient.MAX_RETRIES, delay = ApiClient.RETRY_DELAY) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        // 最後の試行または致命的なエラーの場合は再スロー
        const isFinalAttempt = attempt === maxRetries;
        const isFatalError = error.statusCode === 400 || error.statusCode === 404;
        
        if (isFinalAttempt || isFatalError) {
          throw error;
        }
        
        // 指数バックオフで待機
        const waitTime = delay * Math.pow(2, attempt - 1);
        console.warn(`リトライ ${attempt}/${maxRetries}... ${waitTime}ms後に再試行`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  /**
   * URLをPDFに変換
   * @param {string} url - 変換するURL
   * @param {object} settings - PDF設定
   * @param {Function} onProgress - 進捗コールバック
   * @return {Promise<object>} レスポンス
   */
  async convertToPdf(url, settings = {}, onProgress = () => {}) {
    return this.retryWithBackoff(async () => {
      try {
        const endpoint = `${this.baseUrl}/convertToPdf`;
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url, settings }),
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let result = null;

        while (true) {
          const {done, value} = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              
              if (data.step === 'complete') {
                result = data;
              } else {
                onProgress(data);
              }
            }
          }
        }

        if (!result || !result.success) {
          throw new Error(result?.error || 'PDF変換に失敗しました');
        }

        return result;
      } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          const networkError = new Error(
            'Firebase Functionsに接続できません。ネットワーク接続を確認してください。'
          );
          networkError.name = 'NetworkError';
          networkError.originalError = error;
          throw networkError;
        }
        
        console.error('API Error:', error);
        throw error;
      }
    });
  }
}
