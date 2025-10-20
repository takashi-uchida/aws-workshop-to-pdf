# デプロイ状況

## 🚀 現在の状況

**デプロイ実行中** - Firebase Functionsのデプロイには5-10分かかります

```bash
firebase deploy
```

### 完了した修正

✅ Node.js 20 にアップグレード完了
✅ firebase-functions 4.5.0 → 5.1.0 にアップグレード  
✅ Firebase Functions v2 API に移行
✅ Hosting と Storage のデプロイ成功

### 進行中

⏳ Functions のデプロイ中（Playwright のダウンロード含む）

## 📊 デプロイログの確認

デプロイの進行状況を確認：

```bash
tail -f deploy.log
```

または、Firebase Consoleで確認：
https://console.firebase.google.com/project/aws-workshop-to-pdf/functions

## ✅ デプロイ完了の確認

デプロイが完了すると、以下のメッセージが表示されます：

```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/aws-workshop-to-pdf/overview
Hosting URL: https://aws-workshop-to-pdf.web.app
```

## 🎯 デプロイ完了後の手順

### 1. アプリにアクセス

https://aws-workshop-to-pdf.web.app

### 2. 動作確認

**単一URL変換をテスト:**
1. URL入力: `https://example.com`
2. 「PDFに変換」ボタンをクリック
3. 処理中の表示を確認
4. PDFがダウンロードされることを確認

**初回は時間がかかります:**
- コールドスタート: 10-15秒
- 2回目以降: 3-5秒

### 3. Firebase Consoleで確認

**Functions:**
- https://console.firebase.google.com/project/aws-workshop-to-pdf/functions
- `convertToPdf` 関数が表示されることを確認
- ログを確認

**Storage:**
- https://console.firebase.google.com/project/aws-workshop-to-pdf/storage
- `pdfs/` フォルダを確認
- PDFファイルが生成されることを確認

**Hosting:**
- https://console.firebase.google.com/project/aws-workshop-to-pdf/hosting
- デプロイ履歴を確認

### 4. ライフサイクルポリシーの設定

PDFを24時間後に自動削除するため：

1. Storage → Files タブ
2. 右上の「Lifecycle」をクリック
3. 「Add rule」をクリック
4. 設定:
   - Condition: Age
   - Value: 1 day
   - Action: Delete
   - Path: pdfs/
5. 「Save」をクリック

## 🔧 トラブルシューティング

### デプロイが失敗する

**エラー: "Billing account not configured"**

**原因**: Blazeプランにアップグレードしていない

**解決策**:
1. Firebase Console → 左下「アップグレード」
2. Blazeプランを選択
3. クレジットカード情報を入力

### Functions が動作しない

**エラー: "CORS policy"**

**原因**: API URLが正しく設定されていない

**確認**:
- `public/js/api.js` を確認
- プロジェクトIDが `aws-workshop-to-pdf` であることを確認
- ブラウザのコンソールでエラーを確認

### タイムアウトエラー

**エラー: "Function execution took 60001 ms"**

**原因**: 複雑なページの処理に時間がかかりすぎる

**対処**:
- より軽量なページでテスト
- 必要に応じてタイムアウトを延長（最大540秒）

## 📈 パフォーマンス

### 初回リクエスト（コールドスタート）
- 10-15秒

### 2回目以降
- 3-5秒

### 最適化のヒント
- 頻繁に使用する場合、定期的にリクエストを送信してウォームアップ
- Cloud Schedulerで定期実行（有料）

## 💰 コスト管理

### 無料枠
- Functions: 200万回/月の呼び出し
- Hosting: 10GB/月のストレージ
- Storage: 5GB/月のストレージ

### 想定コスト（月間100回の変換）
- **$0/月** - 無料枠内

### 予算アラートの設定
1. Google Cloud Console → お支払い → 予算とアラート
2. 予算を設定（例: 月$10）

## 🎉 完了！

デプロイが完了したら、以下のURLでアプリにアクセスできます：

**本番URL**: https://aws-workshop-to-pdf.web.app

楽しいPDF変換を！

## 📚 関連ドキュメント

- **README.md** - プロジェクト概要
- **QUICKSTART.md** - クイックスタート
- **SETUP_GUIDE.md** - 詳細なセットアップ
- **FIREBASE_STORAGE_SETUP.md** - Storage設定
- **DEPLOYMENT.md** - デプロイとトラブルシューティング
