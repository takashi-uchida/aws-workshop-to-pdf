/**
 * Progress Reporter Module
 * バッチ処理の進行状況とサマリーを表示する
 */

/**
 * バッチ処理開始を報告
 * @param {number} totalUrls - 総URL数
 */
function reportStart(totalUrls) {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 バッチ処理開始');
  console.log('='.repeat(60));
  console.log(`📊 処理対象: ${totalUrls}個のURL`);
  console.log('='.repeat(60) + '\n');
}

/**
 * 個別URL処理の進行状況を報告
 * @param {number} current - 現在の番号
 * @param {number} total - 総数
 * @param {string} url - 処理中のURL
 * @param {Object} result - 処理結果
 */
function reportProgress(current, total, url, result) {
  const percentage = Math.round((current / total) * 100);
  const status = result.status === 'success' ? '✅' : '❌';
  
  console.log(`\n[${current}/${total}] (${percentage}%) ${status}`);
  console.log(`  URL: ${url}`);
  
  if (result.status === 'success') {
    console.log(`  出力: ${result.fileName}`);
  } else {
    console.log(`  エラー: ${result.error}`);
  }
}

/**
 * バッチ処理完了のサマリーを報告
 * @param {Object} summary - サマリー情報
 * @param {string} outputDir - 出力ディレクトリ
 */
function reportSummary(summary, outputDir) {
  console.log('\n' + '='.repeat(60));
  console.log('✨ バッチ処理完了');
  console.log('='.repeat(60));
  console.log(`📊 統計:`);
  console.log(`  総数: ${summary.total}`);
  console.log(`  成功: ${summary.successful} ✅`);
  console.log(`  失敗: ${summary.failed} ❌`);
  console.log(`  処理時間: ${summary.duration.toFixed(2)}秒`);
  console.log(`  出力先: ${outputDir}`);
  console.log('='.repeat(60) + '\n');
  
  if (summary.failed > 0) {
    console.log('❌ 失敗したURL:');
    summary.results
      .filter(r => r.status === 'failed')
      .forEach(r => {
        console.log(`  - ${r.url}`);
        console.log(`    理由: ${r.error}`);
      });
    console.log('');
  }
}

module.exports = {
  reportStart,
  reportProgress,
  reportSummary
};
