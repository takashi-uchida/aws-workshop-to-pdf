/**
 * BatchProcessor - 複数URLのバッチ処理を管理するクラス
 * 
 * 要件3.2, 3.3, 3.4, 3.5に対応
 */
class BatchProcessor {
  /**
   * BatchProcessorのコンストラクタ
   * @param {PDFConverter} converter - PDF変換を行うPDFConverterインスタンス
   */
  constructor(converter) {
    this.converter = converter;
    this.queue = [];
    this.results = [];
    this.currentIndex = 0;
  }

  /**
   * 単一URLを処理する
   * @param {string} url - 処理するURL
   * @param {Object} settings - PDF変換設定
   * @returns {Promise<Object>} 処理結果
   */
  async processURL(url, settings) {
    const result = {
      url: url,
      status: 'processing',
      timestamp: Date.now(),
      error: null
    };

    try {
      await this.converter.convertToPDF(url, settings);
      result.status = 'success';
    } catch (error) {
      result.status = 'failed';
      result.error = error.message || '変換に失敗しました';
    }

    this.results.push(result);
    return result;
  }

  /**
   * URL配列をバッチ処理する
   * @param {string[]} urls - 処理するURL配列
   * @param {Object} settings - PDF変換設定
   * @param {Function} onProgress - 進捗コールバック関数
   * @returns {Promise<Object>} バッチ処理結果
   */
  async processBatch(urls, settings, onProgress) {
    this.queue = [...urls];
    this.results = [];
    this.currentIndex = 0;

    for (let i = 0; i < urls.length; i++) {
      this.currentIndex = i;
      const url = urls[i];

      // 進捗コールバックを呼び出し（処理開始）
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: urls.length,
          url: url,
          status: 'processing'
        });
      }

      // URLを処理
      const result = await this.processURL(url, settings);

      // 進捗コールバックを呼び出し（処理完了）
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: urls.length,
          url: url,
          status: result.status,
          error: result.error
        });
      }

      // 次のURLの前に少し待機（ブラウザへの負荷軽減）
      if (i < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return this.getResults();
  }

  /**
   * 処理結果のサマリーを取得する
   * @returns {Object} 結果サマリー
   */
  getResults() {
    const successful = this.results.filter(r => r.status === 'success').length;
    const failed = this.results.filter(r => r.status === 'failed').length;

    return {
      total: this.results.length,
      successful: successful,
      failed: failed,
      results: [...this.results]
    };
  }
}
