const fs = require('fs').promises;

/**
 * ファイルからURLを読み込む
 * @param {string} filePath - URLリストファイルのパス
 * @returns {Promise<string[]>} - URL配列
 */
async function readUrlsFromFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#'));
  } catch (error) {
    throw new Error(`URLファイルの読み込みに失敗しました: ${error.message}`);
  }
}

/**
 * URLの妥当性を検証
 * @param {string[]} urls - URL配列
 * @returns {Object[]} - {url, isValid, error}の配列
 */
function validateUrls(urls) {
  return urls.map(url => {
    try {
      new URL(url);
      return { url, isValid: true, error: null };
    } catch (error) {
      return { url, isValid: false, error: error.message };
    }
  });
}

module.exports = {
  readUrlsFromFile,
  validateUrls
};
