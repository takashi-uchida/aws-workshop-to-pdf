const fs = require('fs').promises;
const path = require('path');

/**
 * ファイル名を安全な形式に変換
 * @param {string} fileName - 元のファイル名
 * @returns {string} - サニタイズされたファイル名
 */
function sanitizeFileName(fileName) {
  // 使用できない文字を削除または置換
  let sanitized = fileName
    .replace(/[<>:"/\\|?*]/g, '_')  // 特殊文字を_に置換
    .replace(/\s+/g, '_')            // 空白を_に置換
    .replace(/_+/g, '_')             // 連続する_を1つに
    .replace(/^_|_$/g, '');          // 先頭と末尾の_を削除
  
  // 長さ制限（拡張子を除いて100文字）
  const maxLength = 100;
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized + '.pdf';
}

/**
 * ファイルの存在確認
 * @param {string} filePath - ファイルパス
 * @returns {Promise<boolean>} - 存在する場合true
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * ファイル名の重複を回避
 * @param {string} outputDir - 出力ディレクトリ
 * @param {string} fileName - ファイル名
 * @returns {Promise<string>} - ユニークなファイル名
 */
async function ensureUniqueFileName(outputDir, fileName) {
  const baseName = path.basename(fileName, '.pdf');
  let counter = 1;
  let uniqueName = fileName;
  
  while (await fileExists(path.join(outputDir, uniqueName))) {
    uniqueName = `${baseName}_${counter}.pdf`;
    counter++;
  }
  
  return uniqueName;
}

/**
 * ページタイトルからファイル名を生成
 * @param {Page} page - Playwrightのページオブジェクト
 * @param {string} fallbackUrl - フォールバック用URL
 * @returns {Promise<string>} - ファイル名
 */
async function generateFileNameFromTitle(page, fallbackUrl) {
  try {
    const title = await page.title();
    
    if (title && title.trim().length > 0) {
      return sanitizeFileName(title);
    }
  } catch (error) {
    console.warn('⚠️ タイトル取得失敗、URLベースのファイル名を使用');
  }
  
  // フォールバック: URLベースのファイル名
  const url = new URL(fallbackUrl);
  return sanitizeFileName(url.hostname + url.pathname.replace(/\//g, '_'));
}

module.exports = {
  sanitizeFileName,
  generateFileNameFromTitle,
  ensureUniqueFileName,
  fileExists
};
