/**
 * タスク11.2 自動検証スクリプト
 * 単一URL変換機能の基本的な検証を実行
 */

// テスト結果を格納
const testResults = [];

/**
 * テスト結果を記録
 */
function recordTest(name, passed, message) {
  testResults.push({
    name,
    passed,
    message,
    timestamp: new Date().toISOString()
  });
  
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
}

/**
 * テスト1: URL検証関数のテスト
 */
function testURLValidation() {
  console.log('\n=== テスト1: URL検証関数 ===');
  
  // 有効なURL
  const validURLs = [
    'https://example.com',
    'http://example.com',
    'https://www.google.com',
    'https://github.com/user/repo'
  ];
  
  validURLs.forEach(url => {
    const result = Utils.isValidURL(url);
    recordTest(
      `有効なURL: ${url}`,
      result === true,
      result ? '正しく検証されました' : '検証に失敗しました'
    );
  });
  
  // 無効なURL
  const invalidURLs = [
    '',
    'not-a-url',
    'example.com',
    'ftp://example.com',
    'javascript:alert(1)',
    null,
    undefined
  ];
  
  invalidURLs.forEach(url => {
    const result = Utils.isValidURL(url);
    recordTest(
      `無効なURL: ${url}`,
      result === false,
      result ? '誤って有効と判定されました' : '正しく無効と判定されました'
    );
  });
}

/**
 * テスト2: エラーメッセージ生成のテスト
 */
function testErrorMessages() {
  console.log('\n=== テスト2: エラーメッセージ生成 ===');
  
  const errorTypes = [
    'invalid_url',
    'timeout',
    'cors',
    'network',
    'browser_unsupported',
    'load_failed'
  ];
  
  errorTypes.forEach(errorType => {
    const message = Utils.getErrorMessage(errorType);
    const hasMessage = message && message.length > 0;
    recordTest(
      `エラータイプ: ${errorType}`,
      hasMessage,
      hasMessage ? `メッセージ: ${message.substring(0, 50)}...` : 'メッセージが生成されませんでした'
    );
  });
  
  // CORSエラーメッセージの詳細チェック
  const corsMessage = Utils.getErrorMessage('cors');
  const hasCORSDetails = corsMessage.includes('CORS') && corsMessage.includes('対処方法');
  recordTest(
    'CORSエラーメッセージの詳細',
    hasCORSDetails,
    hasCORSDetails ? 'CORSエラーメッセージに対処方法が含まれています' : 'CORSエラーメッセージが不完全です'
  );
}

/**
 * テスト3: 設定バリデーションのテスト
 */
function testSettingsValidation() {
  console.log('\n=== テスト3: 設定バリデーション ===');
  
  // 有効な設定
  const validSettings = {
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
  
  const validResult = Utils.validateSettings(validSettings);
  recordTest(
    '有効な設定',
    validResult.valid === true,
    validResult.valid ? '設定が正しく検証されました' : `エラー: ${validResult.errors.join(', ')}`
  );
  
  // 無効な設定
  const invalidSettings = {
    pageSize: 'InvalidSize',
    orientation: 'invalid',
    margins: {
      top: 'invalid',
      right: '1cm',
      bottom: '1cm',
      left: '1cm'
    },
    scale: 5.0,
    printBackground: 'not-boolean'
  };
  
  const invalidResult = Utils.validateSettings(invalidSettings);
  recordTest(
    '無効な設定',
    invalidResult.valid === false,
    invalidResult.valid ? '誤って有効と判定されました' : `正しくエラーを検出: ${invalidResult.errors.length}個のエラー`
  );
}

/**
 * テスト4: ブラウザ互換性チェックのテスト
 */
function testBrowserCompatibility() {
  console.log('\n=== テスト4: ブラウザ互換性チェック ===');
  
  const compatResult = Utils.checkBrowserCompatibility();
  
  recordTest(
    'ブラウザ互換性チェック',
    typeof compatResult === 'object',
    `互換性: ${compatResult.compatible}, 非対応機能: ${compatResult.unsupportedFeatures.length}個`
  );
  
  recordTest(
    'ブラウザが互換性あり',
    compatResult.compatible === true,
    compatResult.compatible ? 'ブラウザは互換性があります' : `非対応機能: ${compatResult.unsupportedFeatures.join(', ')}`
  );
}

/**
 * テスト5: URLリストパースのテスト
 */
function testURLListParsing() {
  console.log('\n=== テスト5: URLリストパース ===');
  
  const testInput = `
https://example.com
https://www.google.com
# これはコメント
https://github.com

https://stackoverflow.com
not-a-url
ftp://invalid.com
  `.trim();
  
  const urls = Utils.parseURLList(testInput);
  
  recordTest(
    'URLリストパース',
    urls.length === 4,
    `パースされたURL数: ${urls.length} (期待値: 4)`
  );
  
  recordTest(
    'コメント行の除外',
    !urls.some(url => url.includes('#')),
    'コメント行が正しく除外されました'
  );
  
  recordTest(
    '無効なURLの除外',
    !urls.includes('not-a-url') && !urls.includes('ftp://invalid.com'),
    '無効なURLが正しく除外されました'
  );
}

/**
 * テスト6: HTMLエスケープのテスト
 */
function testHTMLEscape() {
  console.log('\n=== テスト6: HTMLエスケープ ===');
  
  const dangerousInput = '<script>alert("XSS")</script>';
  const escaped = Utils.escapeHtml(dangerousInput);
  
  recordTest(
    'HTMLエスケープ',
    !escaped.includes('<script>'),
    escaped.includes('&lt;script&gt;') ? 'HTMLが正しくエスケープされました' : 'エスケープに失敗しました'
  );
  
  recordTest(
    'XSS攻撃の防止',
    escaped.includes('&lt;') && escaped.includes('&gt;'),
    'XSS攻撃が防止されました'
  );
}

/**
 * テスト7: ブラウザ情報取得のテスト
 */
function testBrowserInfo() {
  console.log('\n=== テスト7: ブラウザ情報取得 ===');
  
  const browserInfo = Utils.getBrowserInfo();
  
  recordTest(
    'ブラウザ名の取得',
    browserInfo.name && browserInfo.name !== 'Unknown',
    `ブラウザ名: ${browserInfo.name}`
  );
  
  recordTest(
    'ブラウザバージョンの取得',
    browserInfo.version && browserInfo.version !== 'Unknown',
    `バージョン: ${browserInfo.version}`
  );
  
  recordTest(
    'OS情報の取得',
    browserInfo.os && browserInfo.os !== 'Unknown',
    `OS: ${browserInfo.os}`
  );
}

/**
 * テスト8: 推奨ブラウザチェックのテスト
 */
function testRecommendedBrowser() {
  console.log('\n=== テスト8: 推奨ブラウザチェック ===');
  
  const recommendedCheck = Utils.isRecommendedBrowser();
  
  recordTest(
    '推奨ブラウザチェック',
    typeof recommendedCheck === 'object',
    `推奨: ${recommendedCheck.recommended}, メッセージ: ${recommendedCheck.message || 'なし'}`
  );
}

/**
 * すべてのテストを実行
 */
function runAllTests() {
  console.log('🚀 タスク11.2 自動検証テストを開始します...\n');
  
  try {
    testURLValidation();
    testErrorMessages();
    testSettingsValidation();
    testBrowserCompatibility();
    testURLListParsing();
    testHTMLEscape();
    testBrowserInfo();
    testRecommendedBrowser();
    
    // 結果サマリー
    console.log('\n=== テスト結果サマリー ===');
    const passed = testResults.filter(r => r.passed).length;
    const failed = testResults.filter(r => !r.passed).length;
    const total = testResults.length;
    
    console.log(`総テスト数: ${total}`);
    console.log(`✅ 成功: ${passed}`);
    console.log(`❌ 失敗: ${failed}`);
    console.log(`成功率: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
      console.log('\n🎉 すべてのテストが成功しました！');
    } else {
      console.log('\n⚠️ 一部のテストが失敗しました。詳細を確認してください。');
    }
    
    // 失敗したテストの詳細
    if (failed > 0) {
      console.log('\n=== 失敗したテスト ===');
      testResults.filter(r => !r.passed).forEach(result => {
        console.log(`❌ ${result.name}: ${result.message}`);
      });
    }
    
    return {
      total,
      passed,
      failed,
      results: testResults
    };
  } catch (error) {
    console.error('テスト実行中にエラーが発生しました:', error);
    return {
      total: testResults.length,
      passed: testResults.filter(r => r.passed).length,
      failed: testResults.filter(r => !r.passed).length + 1,
      error: error.message,
      results: testResults
    };
  }
}

// テストを実行
if (typeof window !== 'undefined') {
  // ブラウザ環境
  window.runValidationTests = runAllTests;
  console.log('✅ 検証テストが読み込まれました。runValidationTests() を実行してテストを開始してください。');
} else {
  // Node.js環境
  module.exports = { runAllTests };
}
