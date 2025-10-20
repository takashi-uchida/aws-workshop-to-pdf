# Puppeteer移行ガイド

## 🔄 変更内容

PlaywrightからPuppeteerに移行しました。

### 理由

Firebase Functionsでは、Playwrightのブラウザバイナリのインストールに問題がありました：

```
Error: Executable doesn't exist at /www-data-home/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell
```

Puppeteerは、Firebase Functionsとの互換性が高く、自動的にChromiumをダウンロードします。

## ✅ 完了した変更

1. **functions/package.json**
   - `playwright` → `puppeteer` に変更
   - postinstallスクリプトを更新

2. **functions/index.js**
   - `chromium.launch()` → `puppeteer.launch()` に変更
   - API の違いを調整（`waitUntil: "networkidle"` → `"networkidle0"`）

## 🚀 デプロイ手順

### 1. 依存関係の更新（完了済み）

```bash
cd functions
npm uninstall playwright
npm install puppeteer
cd ..
```

### 2. Functionsのデプロイ

```bash
firebase deploy --only functions
```

**注意**: 初回デプロイには5-10分かかります（Puppeteerのダウンロード含む）

### 3. デプロイの確認

デプロイが完了すると：

```
✔  functions[convertToPdf(us-central1)] Successful update operation.

✔  Deploy complete!
```

## 🧪 テスト

### ローカルテスト

Firebase Emulatorsでテスト：

```bash
firebase emulators:start
```

### 本番テスト

1. https://aws-workshop-to-pdf.web.app にアクセス
2. URL入力: `https://example.com`
3. 「PDFに変換」ボタンをクリック
4. PDFがダウンロードされることを確認

## 🔧 トラブルシューティング

### エラー: "An unexpected error has occurred"

**原因**: ネットワークエラーまたは一時的な問題

**解決策**: 
```bash
# 再試行
firebase deploy --only functions

# または、キャッシュをクリア
firebase deploy --only functions --force
```

### エラー: "Puppeteer old Chromium revision"

**原因**: Puppeteerのバージョンが古い

**解決策**:
```bash
cd functions
npm install puppeteer@latest
cd ..
firebase deploy --only functions
```

### Functions が起動しない

**確認事項**:
1. Firebase Console → Functions → ログを確認
2. Blazeプランにアップグレード済みか確認
3. メモリ設定が十分か確認（現在: 1GiB）

## 📊 パフォーマンス比較

### Playwright vs Puppeteer

| 項目 | Playwright | Puppeteer |
|------|-----------|-----------|
| Firebase互換性 | ❌ 低い | ✅ 高い |
| デプロイサイズ | 大きい | 中程度 |
| 起動速度 | 速い | 速い |
| PDF品質 | 同等 | 同等 |

## 🎯 次のステップ

1. **Functionsのデプロイ完了を確認**
   ```bash
   firebase functions:log
   ```

2. **本番環境でテスト**
   - https://aws-workshop-to-pdf.web.app

3. **Firebase Consoleで監視**
   - https://console.firebase.google.com/project/aws-workshop-to-pdf/functions

## 📝 コード変更の詳細

### Before (Playwright)

```javascript
const {chromium} = require("playwright");

browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

const context = await browser.newContext({
  viewport: {width: 1280, height: 720},
});

const page = await context.newPage();

await page.goto(url, {
  waitUntil: "networkidle",
  timeout: 30000,
});
```

### After (Puppeteer)

```javascript
const puppeteer = require("puppeteer");

browser = await puppeteer.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
  ],
});

const page = await browser.newPage();

await page.setViewport({width: 1280, height: 720});

await page.goto(url, {
  waitUntil: "networkidle0",
  timeout: 30000,
});
```

## ✅ 完了

Puppeteerへの移行が完了しました。デプロイ後、正常に動作することを確認してください。
