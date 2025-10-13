# Design Document

## Overview

このドキュメントは、Web to PDF Converterツールに複数URLのバッチ処理機能を追加するための設計を定義します。既存のCLI構造を拡張し、複数URLの入力、バッチ処理の実行制御、タイトルベースのファイル名生成、デフォルトモードの変更を実装します。

設計の主要な目標：
- 既存のコードベースとの互換性を維持
- 拡張性のあるアーキテクチャ
- エラーハンドリングと継続性の確保
- ユーザーフレンドリーな進行状況表示

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   CLI Parser    │ ← Commander.js（既存）
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  URL Resolver   │ ← 新規：複数URL入力の解析
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Batch Processor │ ← 新規：バッチ処理のオーケストレーション
└────────┬────────┘
         │
         ├──────────────────┬──────────────────┐
         ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Page Converter │ │  Page Converter │ │  Page Converter │
│   (URL 1)       │ │   (URL 2)       │ │   (URL N)       │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   PDF Output    │ │   PDF Output    │ │   PDF Output    │
└─────────────────┘ └─────────────────┘ └─────────────────┘
         │                  │                  │
         └──────────────────┴──────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Result Summary  │
                  └─────────────────┘
```

### Module Structure

```
cli.js
├── URL Resolver Module（新規）
│   ├── readUrlsFromFile()
│   └── validateUrls()
│
├── Batch Processor Module（新規）
│   ├── BatchProcessor class
│   ├── processBatch()
│   ├── processUrl()
│   └── generateSummary()
│
├── File Name Generator Module（新規）
│   ├── generateFileNameFromTitle()
│   ├── sanitizeFileName()
│   └── ensureUniqueFileName()
│
├── Existing Modules（既存、一部修正）
│   ├── convertPageToPDF()
│   ├── convertSinglePage()
│   ├── convertMultiplePages()
│   └── mergePDFs()
│
└── Progress Reporter Module（新規）
    ├── reportStart()
    ├── reportProgress()
    └── reportSummary()
```

## Components and Interfaces

### 1. URL Resolver Module

ファイルから複数URLを読み込み、処理可能なURL配列を生成します。

```javascript
/**
 * ファイルからURLを読み込む
 * @param {string} filePath - URLリストファイルのパス
 * @returns {Promise<string[]>} - URL配列
 */
async function readUrlsFromFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));
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
```

### 2. Batch Processor Module

バッチ処理のオーケストレーションを担当します。

```javascript
class BatchProcessor {
  constructor(options) {
    this.options = options;
    this.results = [];
    this.startTime = null;
    this.browser = null;
  }

  /**
   * バッチ処理を実行
   * @param {string[]} urls - 処理するURL配列
   * @returns {Promise<Object>} - 処理結果のサマリー
   */
  async processBatch(urls) {
    this.startTime = Date.now();
    this.browser = await chromium.launch({ headless: true });
    
    console.log(`\n🚀 バッチ処理開始: ${urls.length}個のURL\n`);
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`[${i + 1}/${urls.length}] 処理中: ${url}`);
      
      const result = await this.processUrl(url, i);
      this.results.push(result);
      
      // 次のURLまで待機
      if (i < urls.length - 1 && this.options.delay) {
        await new Promise(resolve => 
          setTimeout(resolve, parseInt(this.options.delay))
        );
      }
    }
    
    await this.browser.close();
    
    return this.generateSummary();
  }

  /**
   * 単一URLを処理（リトライロジック付き）
   * @param {string} url - 処理するURL
   * @param {number} index - URL番号
   * @returns {Promise<Object>} - 処理結果
   */
  async processUrl(url, index) {
    const maxRetries = 3;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const fileName = await this.generateFileName(url, index);
        const outputPath = path.join(this.outputDir, fileName);
        
        const success = await this.convertUrl(url, outputPath);
        
        if (success) {
          return {
            url,
            status: 'success',
            fileName,
            outputPath,
            attempt
          };
        }
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          console.log(`  ⚠️ リトライ ${attempt}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    return {
      url,
      status: 'failed',
      error: lastError?.message || 'Unknown error',
      attempts: maxRetries
    };
  }

  /**
   * URLを変換
   * @param {string} url - 変換するURL
   * @param {string} outputPath - 出力パス
   * @returns {Promise<boolean>} - 成功/失敗
   */
  async convertUrl(url, outputPath) {
    if (this.options.mode === 'multi') {
      return await this.convertMultiPage(url, outputPath);
    } else {
      return await convertPageToPDF(this.browser, url, outputPath);
    }
  }

  /**
   * 処理結果のサマリーを生成
   * @returns {Object} - サマリー情報
   */
  generateSummary() {
    const endTime = Date.now();
    const duration = (endTime - this.startTime) / 1000;
    
    const successful = this.results.filter(r => r.status === 'success');
    const failed = this.results.filter(r => r.status === 'failed');
    
    return {
      total: this.results.length,
      successful: successful.length,
      failed: failed.length,
      duration,
      results: this.results
    };
  }
}
```

### 3. File Name Generator Module

ページタイトルからファイル名を生成します。

```javascript
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
    console.warn('タイトル取得失敗、URLベースのファイル名を使用');
  }
  
  // フォールバック: URLベースのファイル名
  const url = new URL(fallbackUrl);
  return sanitizeFileName(url.hostname + url.pathname.replace(/\//g, '_'));
}

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
```

### 4. Progress Reporter Module

進行状況とサマリーを表示します。

```javascript
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
```

## Data Models

### BatchResult

```javascript
{
  url: string,              // 処理したURL
  status: 'success' | 'failed',  // 処理ステータス
  fileName: string,         // 生成されたファイル名（成功時）
  outputPath: string,       // 出力パス（成功時）
  error: string,            // エラーメッセージ（失敗時）
  attempt: number,          // 成功した試行回数
  timestamp: number         // 処理完了時刻
}
```

### BatchSummary

```javascript
{
  total: number,            // 総URL数
  successful: number,       // 成功数
  failed: number,           // 失敗数
  duration: number,         // 処理時間（秒）
  results: BatchResult[],   // 個別結果の配列
  outputDir: string,        // 出力ディレクトリ
  timestamp: string         // 処理開始時刻（ISO形式）
}
```

## Error Handling

### エラーカテゴリと対応

1. **URL解析エラー**
   - 無効なURL形式
   - 対応: スキップして次のURLへ、警告メッセージを表示

2. **ネットワークエラー**
   - タイムアウト、接続失敗
   - 対応: 最大3回リトライ、失敗時は次のURLへ

3. **ページ読み込みエラー**
   - 404、500エラー
   - 対応: エラーログに記録、次のURLへ

4. **PDF生成エラー**
   - メモリ不足、書き込み失敗
   - 対応: エラーログに記録、次のURLへ

5. **ファイルシステムエラー**
   - ディレクトリ作成失敗、権限エラー
   - 対応: 処理を中断、エラーメッセージを表示

### リトライロジック

```javascript
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 2000,  // 2秒
  retryableErrors: [
    'ETIMEDOUT',
    'ECONNRESET',
    'ENOTFOUND',
    'TimeoutError'
  ]
};
```

## Testing Strategy

### Unit Tests

1. **URL Resolver Module**
   - 複数URLの解析テスト
   - ファイルからの読み込みテスト
   - URL検証テスト

2. **File Name Generator Module**
   - タイトルからのファイル名生成テスト
   - サニタイズ処理のテスト
   - 重複回避のテスト

3. **Batch Processor Module**
   - バッチ処理のフローテスト
   - エラーハンドリングのテスト
   - リトライロジックのテスト

### Integration Tests

1. **単一URL処理**
   - 既存機能との互換性確認

2. **複数URL処理**
   - 2-3個のURLでバッチ処理テスト
   - 成功/失敗の混在ケース

3. **エラーケース**
   - 無効なURL
   - タイムアウト
   - ネットワークエラー

### Manual Tests

1. **実際のWebサイトでのテスト**
   - 複数の異なるサイトを同時処理
   - 大量URL（10個以上）の処理

2. **ファイル入力のテスト**
   - URLリストファイルからの読み込み

3. **デフォルトモード変更の確認**
   - `-m`オプション未指定時の動作

## CLI Changes

### 新規オプション

```javascript
program
  .option('-u, --url <url>', '変換するURL')
  .option('--url-file <path>', 'URLリストファイルのパス（複数URL処理用）')
  .option('-m, --mode <mode>', '変換モード: single（単一ページ）またはmulti（複数ページ）', 'multi')  // デフォルト変更
  // ... 既存のオプション
```

### 使用例

```bash
# URLリストファイルから読み込み（バッチ処理）
node cli.js --url-file urls.txt

# 単一URL（デフォルトでmultiモード）
node cli.js -u https://example.com

# 単一URLで単一ページモード（明示的に指定）
node cli.js -u https://example.com -m single
```

## Output Structure

### バッチ処理の出力ディレクトリ構造

```
output/
└── batch_20250114_153045/
    ├── Example_Domain.pdf
    ├── Another_Page_Title.pdf
    ├── Third_Website_Homepage.pdf
    └── batch_summary.json
```

### batch_summary.json の形式

```json
{
  "total": 3,
  "successful": 2,
  "failed": 1,
  "duration": 45.23,
  "outputDir": "output/batch_20250114_153045",
  "timestamp": "2025-01-14T15:30:45.123Z",
  "results": [
    {
      "url": "https://example.com",
      "status": "success",
      "fileName": "Example_Domain.pdf",
      "outputPath": "output/batch_20250114_153045/Example_Domain.pdf",
      "attempt": 1,
      "timestamp": 1705245045123
    },
    {
      "url": "https://example.org",
      "status": "failed",
      "error": "Timeout: page.goto: Timeout 60000ms exceeded",
      "attempts": 3,
      "timestamp": 1705245075456
    }
  ]
}
```

## Implementation Notes

### 既存コードとの統合

1. **convertPageToPDF()の拡張**
   - ページタイトル取得機能を追加
   - ファイル名生成ロジックを統合

2. **main()関数の再構成**
   - URL解析ロジックを追加
   - バッチ処理とシングル処理の分岐

3. **後方互換性の維持**
   - 既存のオプションはすべて維持
   - 単一URL指定時は従来通りの動作

### パフォーマンス考慮事項

1. **並列処理の検討**
   - 現時点では順次処理（シンプルで安全）
   - 将来的に並列処理オプションを追加可能

2. **メモリ管理**
   - ブラウザインスタンスの再利用
   - ページオブジェクトの適切なクローズ

3. **ディスク容量**
   - 大量PDF生成時の容量チェック（将来的な拡張）

## Migration Path

### Phase 1: Core Implementation
- URL Resolver Module
- File Name Generator Module
- デフォルトモード変更

### Phase 2: Batch Processing
- Batch Processor Module
- Progress Reporter Module
- エラーハンドリング

### Phase 3: Polish & Testing
- 統合テスト
- ドキュメント更新
- パフォーマンス最適化
