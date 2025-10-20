# 次のステップ

Web to PDF Converterの実装が完了しました！以下の手順でデプロイしてください。

## 📋 完了した作業

✅ Firebase設定ファイル（firebase.json、.firebaserc）
✅ Firebase Functions（PDF変換API）
✅ フロントエンド（HTML、CSS、JavaScript）
✅ Firebase Storage設定
✅ レスポンシブデザイン
✅ ドキュメント（README.md、DEPLOYMENT.md）

## 🚀 デプロイ手順

### 1. Firebaseプロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/)でプロジェクトを作成
2. Blazeプラン（従量課金）にアップグレード

### 2. プロジェクトIDの設定

プロジェクトIDは`aws-workshop-to-pdf`に設定済みです。

別のプロジェクトIDを使用する場合は、以下のファイルを編集してください：

**`.firebaserc`**
```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

**`public/js/api.js`**
```javascript
this.baseUrl = window.location.hostname === 'localhost' 
  ? 'http://localhost:5001/your-project-id/us-central1'
  : 'https://us-central1-your-project-id.cloudfunctions.net';
```

### 3. Functions依存関係のインストール

```bash
cd functions
npm install
cd ..
```

### 4. デプロイ

```bash
firebase deploy
```

### 5. Firebase Storageライフサイクルの設定

Firebase Consoleで：
1. Storage → Lifecycle
2. Add rule:
   - Condition: Age = 1 day
   - Action: Delete
   - Path: pdfs/

## 🧪 テスト

デプロイ後、以下をテストしてください：

1. **単一URL変換**
   - https://example.com などでテスト
   - PDFがダウンロードされることを確認

2. **バッチ変換**
   - 複数のURLを入力してテスト
   - 各PDFが順次ダウンロードされることを確認

3. **エラーハンドリング**
   - 無効なURLでエラーメッセージを確認
   - 存在しないURLでエラーハンドリングを確認

## 📝 重要な注意事項

### コスト管理

- 月間100回程度の変換なら無料枠内
- Firebase Consoleで使用量を定期的に確認
- 予算アラートを設定することを推奨

### セキュリティ

- `storage.rules`が正しく設定されていることを確認
- Firebase ConsoleでドメインAPI制限を設定
- 不正使用を監視

### パフォーマンス

- 初回リクエストは10-15秒かかる（コールドスタート）
- 複雑なページは60秒以内に処理できない場合がある
- 必要に応じてタイムアウト設定を調整

## 📚 ドキュメント

- **README.md**: プロジェクト概要とセットアップ
- **DEPLOYMENT.md**: 詳細なデプロイ手順とトラブルシューティング

## 🔧 ローカル開発

Firebase Emulatorsでローカルテスト：

```bash
firebase emulators:start
```

- Hosting: http://localhost:5000
- Functions: http://localhost:5001

## ❓ トラブルシューティング

問題が発生した場合：

1. Firebase Functionsのログを確認：
   ```bash
   firebase functions:log
   ```

2. DEPLOYMENT.mdのトラブルシューティングセクションを参照

3. Firebase Consoleでエラーログを確認

## 🎉 完了！

すべての手順が完了したら、WebアプリがFirebaseにデプロイされ、インターネット経由でアクセス可能になります。

デプロイURL: `https://aws-workshop-to-pdf.web.app`

楽しいPDF変換を！
