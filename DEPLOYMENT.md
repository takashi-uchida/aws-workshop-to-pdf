# デプロイ手順

このドキュメントでは、Web to PDF ConverterをFirebaseにデプロイする手順を説明します。

## 事前準備

### 1. Firebaseプロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: web-to-pdf-converter）
4. Google Analyticsは任意で設定
5. プロジェクトを作成

### 2. Firebase Blaze プランへのアップグレード

Firebase Functionsを使用するには、Blazeプラン（従量課金）が必要です：

1. Firebase Consoleでプロジェクトを開く
2. 左下の「アップグレード」をクリック
3. Blazeプランを選択
4. 支払い情報を入力

### 3. プロジェクトIDの確認

プロジェクトIDは`aws-workshop-to-pdf`に設定済みです。

別のプロジェクトIDを使用する場合は、以下のファイルを編集してください：
- `.firebaserc`
- `public/js/api.js`

## デプロイ

### 1. Functions依存関係のインストール

```bash
cd functions
npm install
cd ..
```

### 2. 初回デプロイ

```bash
firebase deploy
```

このコマンドで以下がデプロイされます：
- Firebase Hosting（静的ファイル）
- Firebase Functions（PDF変換API）
- Firebase Storage（セキュリティルール）

### 3. デプロイ確認

デプロイが完了すると、Hosting URLが表示されます：

```
✔  Deploy complete!

Hosting URL: https://aws-workshop-to-pdf.web.app
```

このURLにアクセスして、アプリが正常に動作することを確認してください。

## Firebase Storageライフサイクルの設定

PDFファイルを24時間後に自動削除するため、ライフサイクルポリシーを設定します：

1. Firebase Consoleを開く
2. 「Storage」→「Rules」タブを開く
3. 「Lifecycle」タブを開く
4. 「Add rule」をクリック
5. 以下の設定を追加：
   - **Condition**: Age
   - **Value**: 1 day
   - **Action**: Delete
   - **Path**: pdfs/

## テスト

### 1. 単一URL変換のテスト

1. デプロイされたURLにアクセス
2. 「単一URL」タブで任意のURLを入力（例: https://example.com）
3. 「PDFに変換」ボタンをクリック
4. PDFがダウンロードされることを確認

### 2. バッチ変換のテスト

1. 「バッチ変換」タブに切り替え
2. 複数のURLを入力：
   ```
   https://example.com
   https://google.com
   https://github.com
   ```
3. 「バッチ変換開始」ボタンをクリック
4. 各PDFが順次ダウンロードされることを確認

### 3. エラーハンドリングのテスト

1. 無効なURLを入力（例: invalid-url）
2. エラーメッセージが表示されることを確認
3. 存在しないURLを入力（例: https://this-domain-does-not-exist-12345.com）
4. 適切なエラーメッセージが表示されることを確認

## ログの確認

Firebase Functionsのログを確認：

```bash
firebase functions:log
```

または、Firebase Consoleで：
1. 「Functions」→「ログ」タブを開く
2. エラーや警告がないか確認

## トラブルシューティング

### Functionsがデプロイできない

**エラー**: `Error: HTTP Error: 403, Billing account not configured`

**解決策**: Firebase Blazeプランにアップグレードしてください。

### Playwrightがインストールできない

**エラー**: `Failed to download Chromium`

**解決策**: 
1. `functions/package.json`でPlaywrightのバージョンを確認
2. 必要に応じて最新版に更新
3. 再デプロイ

### CORSエラー

**エラー**: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**解決策**: 
1. `functions/index.js`のCORS設定を確認
2. `Access-Control-Allow-Origin`が正しく設定されているか確認

### タイムアウトエラー

**エラー**: `Function execution took 60001 ms, finished with status: 'timeout'`

**解決策**:
1. より軽量なページでテスト
2. 必要に応じて`functions/index.js`のタイムアウト設定を調整（最大540秒）

## 更新とメンテナンス

### コードの更新

1. コードを変更
2. 再デプロイ：
   ```bash
   firebase deploy
   ```

### Hostingのみ更新

フロントエンドのみ変更した場合：

```bash
firebase deploy --only hosting
```

### Functionsのみ更新

バックエンドのみ変更した場合：

```bash
firebase deploy --only functions
```

## コスト管理

### 使用量の確認

Firebase Consoleで使用量を確認：
1. 「使用状況」タブを開く
2. Functions、Hosting、Storageの使用量を確認

### アラートの設定

予算アラートを設定：
1. Google Cloud Consoleを開く
2. 「お支払い」→「予算とアラート」
3. 予算を設定（例: 月$10）

## セキュリティ

### APIキーの保護

Firebase設定は公開されても問題ありませんが、以下に注意：
- Firebase Consoleでドメイン制限を設定
- 不正使用を監視

### Storageセキュリティ

`storage.rules`が正しく設定されていることを確認：
- 読み取りは署名付きURLのみ
- 書き込みは禁止

## まとめ

これで、Web to PDF ConverterがFirebaseにデプロイされ、インターネット経由でアクセス可能になりました！

問題が発生した場合は、Firebase Consoleのログを確認するか、GitHubでIssueを作成してください。
