# Firebase Storage セットアップ

## ⚠️ エラー内容

```
Error: Firebase Storage has not been set up on project 'aws-workshop-to-pdf'. 
Go to https://console.firebase.google.com/project/aws-workshop-to-pdf/storage 
and click 'Get Started' to set up Firebase Storage.
```

## 🔧 解決方法

### ステップ1: Firebase Storageを有効化

1. **Firebase Consoleにアクセス**
   
   https://console.firebase.google.com/project/aws-workshop-to-pdf/storage

2. **「始める」をクリック**
   
   画面中央の「Get Started」または「始める」ボタンをクリック

3. **セキュリティルールを選択**
   
   2つの選択肢が表示されます：
   
   - ✅ **本番環境モードで開始**（推奨）
     - セキュアなルールで開始
     - 後でカスタムルールをデプロイ
   
   - ❌ テストモードで開始
     - 誰でもアクセス可能（非推奨）
   
   **「本番環境モードで開始」を選択** → 「次へ」

4. **ロケーションを選択**
   
   Cloud Storageのロケーションを選択：
   
   - 🇯🇵 **asia-northeast1** (東京) - 推奨
   - 🇺🇸 us-central1 (アイオワ)
   - 🇪🇺 europe-west1 (ベルギー)
   
   ⚠️ **注意**: ロケーションは後から変更できません
   
   「完了」をクリック

5. **完了を待つ**
   
   Storageバケットの作成に数秒〜1分かかります。
   
   完了すると、Storageダッシュボードが表示されます。

### ステップ2: デプロイを再実行

ターミナルに戻り、再度デプロイを実行：

```bash
firebase deploy
```

今度は成功するはずです！

## 📊 デプロイの進行状況

デプロイには5-10分かかる場合があります：

```
=== Deploying to 'aws-workshop-to-pdf'...

i  deploying storage, functions, hosting
✔  storage: rules file storage.rules compiled successfully
i  functions: ensuring required API cloudfunctions.googleapis.com is enabled...
i  functions: ensuring required API cloudbuild.googleapis.com is enabled...
✔  functions: required API cloudfunctions.googleapis.com is enabled
✔  functions: required API cloudbuild.googleapis.com is enabled
i  functions: preparing functions directory for uploading...
i  functions: packaged functions (XX.XX KB) for uploading
✔  functions: functions folder uploaded successfully
i  hosting[aws-workshop-to-pdf]: beginning deploy...
i  hosting[aws-workshop-to-pdf]: found XX files in public
✔  hosting[aws-workshop-to-pdf]: file upload complete
i  functions: creating Node.js 20 function convertToPdf...
✔  functions[convertToPdf]: Successful create operation.
✔  hosting[aws-workshop-to-pdf]: release complete

✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/aws-workshop-to-pdf/overview
Hosting URL: https://aws-workshop-to-pdf.web.app
```

## 🎉 デプロイ完了後

### 1. アプリにアクセス

https://aws-workshop-to-pdf.web.app

### 2. 動作確認

**単一URL変換をテスト:**
1. URL入力: `https://example.com`
2. 「PDFに変換」ボタンをクリック
3. PDFがダウンロードされることを確認

### 3. Firebase Consoleで確認

**Functions:**
- https://console.firebase.google.com/project/aws-workshop-to-pdf/functions
- `convertToPdf` 関数が表示されることを確認

**Storage:**
- https://console.firebase.google.com/project/aws-workshop-to-pdf/storage
- `pdfs/` フォルダが作成されることを確認（PDF生成後）

**Hosting:**
- https://console.firebase.google.com/project/aws-workshop-to-pdf/hosting
- デプロイ履歴を確認

### 4. ライフサイクルポリシーの設定

PDFを24時間後に自動削除するため：

1. **Storage → Files タブ**
2. **右上の「Lifecycle」をクリック**
3. **「Add rule」をクリック**
4. **設定:**
   - Condition: Age
   - Value: 1 day
   - Action: Delete
   - Path: pdfs/
5. **「Save」をクリック**

## 🔧 トラブルシューティング

### エラー: "Billing account not configured"

**原因**: Blazeプランにアップグレードしていない

**解決策**:
1. Firebase Console → 左下「アップグレード」
2. Blazeプランを選択
3. クレジットカード情報を入力

### エラー: "Failed to download Chromium"

**原因**: Playwrightのインストールに失敗

**解決策**:
```bash
cd functions
npx playwright install chromium
cd ..
firebase deploy --only functions
```

### Functions のデプロイが遅い

**原因**: 初回デプロイ時、Playwrightのダウンロードに時間がかかる

**対処**: 10-15分待つ（初回のみ）

### CORS エラー

**原因**: API URLが正しく設定されていない

**確認**:
- `public/js/api.js` を確認
- プロジェクトIDが `aws-workshop-to-pdf` であることを確認

## 📚 次のステップ

1. **予算アラートの設定**
   - Google Cloud Console → お支払い → 予算とアラート
   - 月$10などの予算を設定

2. **カスタムドメインの設定（オプション）**
   - Firebase Console → Hosting → カスタムドメインを追加

3. **Firebase Analyticsの有効化（オプション）**
   - Firebase Console → Analytics

## 🎉 完了！

Firebase Storageのセットアップが完了し、アプリが正常にデプロイされました！

**本番URL**: https://aws-workshop-to-pdf.web.app

楽しいPDF変換を！
