/**
 * ユーティリティ関数
 */

/**
 * URLの妥当性を検証
 * @param {string} url - 検証するURL
 * @return {boolean} 有効なURLの場合true
 */
function isValidURL(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

/**
 * テキストからURLリストをパース
 * @param {string} text - パースするテキスト
 * @return {string[]} URL配列
 */
function parseURLList(text) {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#') && !line.startsWith('//'))
    .filter(line => isValidURL(line));
}

/**
 * エラーメッセージを生成
 * @param {Error|string} error - エラーオブジェクトまたはメッセージ
 * @return {string} 日本語のエラーメッセージ
 */
function getErrorMessage(error) {
  if (typeof error === 'string') {
    return error;
  }

  if (error.message) {
    // 一般的なエラーメッセージを日本語化
    if (error.message.includes('Failed to fetch')) {
      return 'ネットワークエラーが発生しました。接続を確認してください。';
    }
    if (error.message.includes('timeout')) {
      return '処理がタイムアウトしました。URLを確認してください。';
    }
    return error.message;
  }

  return '不明なエラーが発生しました。';
}

/**
 * 設定の妥当性を検証
 * @param {object} settings - 検証する設定
 * @return {boolean} 有効な設定の場合true
 */
function validateSettings(settings) {
  const validPageSizes = ['A4', 'Letter', 'Legal'];
  
  if (settings.pageSize && !validPageSizes.includes(settings.pageSize)) {
    return false;
  }

  return true;
}

/**
 * 期限表示用にタイムスタンプを整形
 * @param {string} timestamp - ISO形式タイムスタンプ
 * @return {string} フォーマット済み日時
 */
function formatExpiration(timestamp) {
  try {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return timestamp;
    }
    return date.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
  } catch (error) {
    console.error('期限表示の整形に失敗:', error);
    return timestamp;
  }
}
