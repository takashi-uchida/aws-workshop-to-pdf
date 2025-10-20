# セットアップガイド

このガイドでは、Web to PDF ConverterをFirebaseにデプロイするための手順を説明します。

## 📋 前提条件

- Node.js 20以上（現在: v20.19.1 ✅）
- Firebase CLI（インストール済み ✅）
- Googleアカウント
- クレジットカード（Firebase Blazeプラン用）

## 🚀 セットアップ手順

### ステップ1: Firebaseにログイン

ターミナルで以下のコマンドを実行：

```bash
firebase login
```

ブラウザが開き、Googleアカウントでログインします。

### ステップ2: Firebaseプロジェクトの作成

2つの方法があります：

#### 方法A: Firebase Consoleで作成（推奨）

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名: `aws-workshop-to-pdf`
4. Google Analyticsは任意で設定
5. プロジェクトを作成

#### 方法B: CLIで作成

```bash
firebase projects:create aws-workshop-to-pdf
```

### ステップ3: Blazeプランへのアップグレード

Firebase Functionsを使用するには、Blazeプラン（従量課金）が必要です。

1. [Firebase Console](https://console.firebase.google.com/)でプロジェクトを開く
2. 左下の「アップグレード」をクリック
3. Blazeプランを選択
4. 支払い情報を入力

**注意**: 月間100回程度の変換なら無料枠内で運用可能です。

### ステップ4: Firebaseプロジェクトの初期化

プロジェクトが既に存在する場合、このステップはスキップできます。

```bash
firebase init
```

以下を選択：
- ✅ Hosting
- ✅ Functions
- ✅ Storage

設定：
- Functions言語: JavaScript
- ESLint: Yes
- 依存関係のインストール: Yes
- Public directory: public
- Single-page app: Yes

### ステップ5: Functions依存関係の確認

```bash
cd functions
npm install
cd ..
```

すでにインストール済みです ✅

### ステップ6: ローカルテスト（オプション）

Firebase Emulatorsでローカルテスト：

```bash
firebase emulators:start
```

- Hosting: http://localhost:5000
- Functions: http://localhost:5001

**注意**: Playwrightのダウンロードに時間がかかる場合があります。

### ステップ7: デプロイ

すべてをデプロイ：

```bash
firebase deploy
```

または個別にデプロイ：

```bash
# Hostingのみ
firebase deploy --only hosting

# Functionsのみ
firebase deploy --only functions

# Storageルールのみ
firebase deploy --only storage
```

### ステップ8: Firebase Storageライフサイクルの設定

PDFファイルを24時間後に自動削除するため：

1. [Firebase Console](https://console.firebase.google.com/)を開く
2. プロジェクト「aws-workshop-to-pdf」を選択
3. 左メニューから「Storage」を選択
4. 「Rules」タブを開く
5. 「Lifecycle」タブを開く
6. 「Add rule」をクリック
7. 以下の設定：
   - **Condition**: Age
   - **Value**: 1 day
   - **Action**: Delete
   - **Path**: pdfs/
8. 「Save」をクリック

### ステップ9: 動作確認

デプロイが完了したら、以下のURLにアクセス：

**Hosting URL**: https://aws-workshop-to-pdf.web.app

テスト：
1. 単一URL変換: https://example.com を入力
2. PDFがダウンロードされることを確認

## 🔧 トラブルシューティング

### エラー: "Project not found"

プロジェクトが作成されていません。ステップ2を実行してください。

### エラー: "Billing account not configured"

Blazeプランにアップグレードしていません。ステップ3を実行してください。

### エラー: "Failed to download Chromium"

Playwrightのインストールに失敗しています：

```bash
cd functions
npx playwright install chromium
cd ..
```

### エラー: "CORS policy"

API URLが正しく設定されているか確認：
- `public/js/api.js`を確認
- プロジェクトIDが`aws-workshop-to-pdf`であることを確認

### タイムアウトエラー

複雑なページは60秒以内に処理できない場合があります。
より軽量なページでテストしてください。

## 📊 コスト管理

### 使用量の確認

Firebase Consoleで使用量を確認：
1. プロジェクトを開く
2. 「使用状況」タブを確認

### 予算アラートの設定

1. [Google Cloud Console](https://console.cloud.google.com/)を開く
2. プロジェクト「aws-workshop-to-pdf」を選択
3. 「お支払い」→「予算とアラート」
4. 予算を設定（例: 月$10）

## 🎉 完了！

セットアップが完了しました。以下のURLでアプリにアクセスできます：

**本番URL**: https://aws-workshop-to-pdf.web.app

## 📚 次のステップ

- カスタムドメインの設定
- Firebase Analyticsの有効化
- パフォーマンスモニタリングの設定

詳細は`DEPLOYMENT.md`を参照してください。
