# クイックスタートガイド

## ⚠️ 現在の状況

Firebaseプロジェクト`aws-workshop-to-pdf`がまだ作成されていません。

```
Error: Failed to get Firebase project aws-workshop-to-pdf. 
Please make sure the project exists and your account has permission to access it.
```

## 🔧 解決方法

### ステップ1: Firebase Consoleでプロジェクトを作成

1. **Firebase Consoleにアクセス**
   
   https://console.firebase.google.com/

2. **「プロジェクトを追加」をクリック**

3. **プロジェクト情報を入力**
   - プロジェクト名: `AWS Workshop to PDF`
   - プロジェクトID: `aws-workshop-to-pdf`
   
   ⚠️ **重要**: プロジェクトIDは必ず`aws-workshop-to-pdf`にしてください

4. **Google Analyticsの設定**
   - 任意で有効化（推奨: 無効）

5. **プロジェクトを作成**
   - 作成完了まで数秒待ちます

### ステップ2: Blazeプランにアップグレード

Firebase Functionsを使用するには、Blazeプラン（従量課金）が必要です。

1. **プロジェクトを開く**
   - 作成したプロジェクトをクリック

2. **アップグレード**
   - 左下の「アップグレード」ボタンをクリック
   - または、左下の歯車アイコン → 「使用量と請求」

3. **Blazeプランを選択**
   - 「Blazeプラン」を選択
   - 「プランを選択」をクリック

4. **支払い情報を入力**
   - クレジットカード情報を入力
   - 請求先住所を入力

5. **確認**
   - 「購入」または「確認」をクリック

**💰 コストについて**:
- 月間100回程度の変換なら無料枠内で運用可能
- 無料枠を超えた場合のみ課金されます
- 予算アラートを設定することを推奨

### ステップ3: Firebase CLIでログイン確認

ターミナルで以下を実行：

```bash
firebase login
```

既にログイン済みの場合：

```bash
firebase login --reauth
```

### ステップ4: プロジェクトの確認

プロジェクトが作成されたことを確認：

```bash
firebase projects:list
```

`aws-workshop-to-pdf`が表示されることを確認してください。

### ステップ5: デプロイ

```bash
firebase deploy
```

初回デプロイには5-10分かかる場合があります（Playwrightのダウンロード含む）。

## 📊 デプロイ後の確認

デプロイが完了すると、以下のURLが表示されます：

```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/aws-workshop-to-pdf/overview
Hosting URL: https://aws-workshop-to-pdf.web.app
```

### アクセステスト

1. **Hosting URLにアクセス**
   
   https://aws-workshop-to-pdf.web.app

2. **単一URL変換をテスト**
   - URL入力: `https://example.com`
   - 「PDFに変換」ボタンをクリック
   - PDFがダウンロードされることを確認

3. **Firebase Consoleで確認**
   - Functions → ログを確認
   - Storage → ファイルを確認

## 🔧 トラブルシューティング

### プロジェクトIDが既に使用されている

エラー: `Project ID 'aws-workshop-to-pdf' is already in use`

**解決策**: 別のプロジェクトIDを使用

1. プロジェクトID: `aws-workshop-to-pdf-XXXXX`（XXXXXは任意の数字）
2. 以下のファイルを更新：
   - `.firebaserc`
   - `public/js/api.js`

### Blazeプランにアップグレードできない

**原因**: クレジットカード情報が必要

**解決策**: 
- 有効なクレジットカードを登録
- または、Google Cloud Platformで請求先アカウントを作成

### デプロイが失敗する

**エラー**: `Error: HTTP Error: 403, Billing account not configured`

**解決策**: Blazeプランにアップグレード（ステップ2）

### Functions のデプロイが遅い

**原因**: Playwrightのダウンロードに時間がかかる

**対処**: 
- 初回は10-15分かかる場合があります
- 気長に待ちましょう

## 📚 次のステップ

デプロイが完了したら：

1. **Firebase Storageライフサイクルの設定**
   - Firebase Console → Storage → Lifecycle
   - 24時間後に自動削除するルールを追加

2. **予算アラートの設定**
   - Google Cloud Console → お支払い → 予算とアラート
   - 月$10などの予算を設定

3. **カスタムドメインの設定（オプション）**
   - Firebase Console → Hosting → カスタムドメインを追加

## 🎉 完了！

これで、Web to PDF ConverterがFirebaseにデプロイされました！

**本番URL**: https://aws-workshop-to-pdf.web.app

楽しいPDF変換を！
