# 要件ドキュメント

## はじめに

既存のNode.js/Playwright CLIツール（AWS WorkshopのWebページをPDF化）をブラウザベースのWebアプリケーションに変換し、Firebaseにデプロイします。GitHub PagesではCORS制限により任意のWebページをPDF化できなかったため、Firebase Functions（サーバーサイド処理）を使用してこの制限を回避します。

## 用語集

- **Webアプリ**: ブラウザで動作するフロントエンドアプリケーション
- **Firebase Hosting**: Googleが提供する静的サイトホスティングサービス
- **Firebase Functions**: サーバーサイドでNode.jsコードを実行するサービス
- **Firebase Storage**: ファイルを保存するクラウドストレージサービス
- **PDFConverter**: Playwrightを使用してサーバーサイドでPDFを生成するコンポーネント
- **BatchProcessor**: 複数URLを順次処理するコンポーネント
- **CORS**: Cross-Origin Resource Sharing（クロスオリジンリソース共有）

## 要件

### 要件1: 基本機能

**ユーザーストーリー:** ユーザーとして、WebページのURLを入力してPDFに変換したい。そうすることで、オフラインでコンテンツを閲覧できる。

#### 受け入れ基準

1. THE Webアプリ SHALL ユーザーが入力した単一のURLを受け付ける
2. WHEN ユーザーが変換ボタンをクリックしたとき、THE Webアプリ SHALL Firebase Functionsに変換リクエストを送信する
3. THE Webアプリ SHALL Chrome、Firefox、Safari、Edgeの最新版で動作する
4. THE Firebase Functions SHALL Playwrightを使用してサーバーサイドでPDFを生成する
5. WHEN PDF生成が完了したとき、THE Webアプリ SHALL PDFファイルをダウンロードする

### 要件2: 単一URL変換

**ユーザーストーリー:** ユーザーとして、1つのWebページを素早くPDF化したい。そうすることで、重要な情報を保存できる。

#### 受け入れ基準

1. THE Webアプリ SHALL 入力されたURLの形式を検証する
2. WHEN 有効なURLが入力されたとき、THE Webアプリ SHALL Firebase FunctionsのHTTPエンドポイントにPOSTリクエストを送信する
3. THE Firebase Functions SHALL PlaywrightでURLを読み込み、PDFを生成する
4. THE Firebase Functions SHALL 生成されたPDFをFirebase Storageに保存する
5. WHEN PDF生成が完了したとき、THE Firebase Functions SHALL ダウンロードURLを返す
6. THE Webアプリ SHALL 返されたURLからPDFをダウンロードする
7. IF PDF生成が60秒以内に完了しないとき、THEN THE Firebase Functions SHALL タイムアウトエラーを返す
8. WHEN 変換処理が完了または失敗したとき、THE Webアプリ SHALL 結果をユーザーに通知する

### 要件3: バッチURL変換

**ユーザーストーリー:** ユーザーとして、複数のWebページを一度にPDF化したい。そうすることで、作業時間を短縮できる。

#### 受け入れ基準

1. THE Webアプリ SHALL 複数行のテキスト入力から複数のURLを受け付ける
2. THE Webアプリ SHALL 各URLに対して個別にFirebase Functionsを呼び出す
3. WHILE バッチ処理が実行中のとき、THE Webアプリ SHALL 進捗状況を表示する
4. WHEN バッチ処理が完了したとき、THE Webアプリ SHALL 成功数と失敗数を含むサマリーを表示する
5. IF 個別のURL処理が失敗したとき、THEN THE Webアプリ SHALL 処理を継続し、次のURLを処理する
6. THE Webアプリ SHALL 各PDFを個別にダウンロード可能にする

### 要件4: PDF設定のカスタマイズ

**ユーザーストーリー:** ユーザーとして、PDFのページサイズや向きを設定したい。そうすることで、用途に応じた最適なPDFを生成できる。

#### 受け入れ基準

1. THE Webアプリ SHALL ページサイズ（A4、Letter、Legal）の選択肢を提供する
2. THE Webアプリ SHALL 設定をlocalStorageに保存する
3. THE Webアプリ SHALL ページ向き（縦、横）の選択肢を提供する
4. WHEN ページがリロードされたとき、THE Webアプリ SHALL 保存された設定を復元する

### 要件5: ユーザーインターフェース

**ユーザーストーリー:** ユーザーとして、直感的で使いやすいインターフェースを使いたい。そうすることで、迷わず操作できる。

#### 受け入れ基準

1. THE Webアプリ SHALL 単一URL変換とバッチ変換を切り替えるタブを提供する
2. THE Webアプリ SHALL 処理中にローディングインジケーターを表示する
3. THE Webアプリ SHALL エラーメッセージを日本語で表示する
4. THE Webアプリ SHALL すべてのテキストを日本語で表示する

### 要件6: Firebaseデプロイ

**ユーザーストーリー:** 開発者として、WebアプリをFirebaseにデプロイしたい。そうすることで、ユーザーがインターネット経由でアクセスできる。

#### 受け入れ基準

1. THE プロジェクト SHALL Firebase設定ファイル（firebase.json、.firebaserc）を含む
2. THE プロジェクト SHALL Firebase Functionsの依存関係を管理するpackage.jsonを含む
3. THE プロジェクト SHALL デプロイ手順を記載したドキュメントを含む
4. WHEN デプロイコマンドが実行されたとき、THE プロジェクト SHALL 静的ファイルをFirebase Hostingにアップロードする
5. WHEN デプロイコマンドが実行されたとき、THE プロジェクト SHALL Firebase Functionsをデプロイする
6. THE Webアプリ SHALL HTTPSで提供される
7. THE Firebase Functions SHALL HTTPSエンドポイントとして公開される
8. THE プロジェクト SHALL Firebase Storageのセキュリティルールを設定する

### 要件7: エラーハンドリングと制限事項の説明

**ユーザーストーリー:** ユーザーとして、エラーが発生したときに原因と対処法を知りたい。そうすることで、問題を解決できる。

#### 受け入れ基準

1. THE Webアプリ SHALL 使用方法を説明するヘルプセクションを提供する
2. IF Firebase Functionsがエラーを返したとき、THEN THE Webアプリ SHALL エラーメッセージを日本語で表示する
3. THE Firebase Functions SHALL エラーの詳細をログに記録する
4. IF URLにアクセスできないとき、THEN THE Firebase Functions SHALL 適切なエラーメッセージを返す
5. THE Webアプリ SHALL ネットワークエラーを適切に処理する

### 要件8: レスポンシブデザイン

**ユーザーストーリー:** ユーザーとして、モバイルデバイスでもWebアプリを使いたい。そうすることで、場所を選ばず作業できる。

#### 受け入れ基準

1. WHEN ビューポート幅が640px未満のとき、THE Webアプリ SHALL モバイル向けレイアウトを表示する
2. WHEN ビューポート幅が640px以上1024px未満のとき、THE Webアプリ SHALL タブレット向けレイアウトを表示する
3. WHEN ビューポート幅が1024px以上のとき、THE Webアプリ SHALL デスクトップ向けレイアウトを表示する
4. THE Webアプリ SHALL すべてのデバイスで読みやすいフォントサイズを使用する

### 要件9: Firebase Functionsの実装

**ユーザーストーリー:** 開発者として、既存のCLIコードを再利用してFirebase Functionsを実装したい。そうすることで、開発時間を短縮できる。

#### 受け入れ基準

1. THE Firebase Functions SHALL HTTPSトリガーでPDF変換エンドポイントを公開する
2. THE Firebase Functions SHALL リクエストボディからURLとPDF設定を受け取る
3. THE Firebase Functions SHALL Playwrightを使用してWebページを読み込む
4. THE Firebase Functions SHALL PlaywrightのPDF生成機能を使用する
5. THE Firebase Functions SHALL 生成されたPDFをFirebase Storageにアップロードする
6. THE Firebase Functions SHALL 署名付きダウンロードURLを生成する
7. THE Firebase Functions SHALL ダウンロードURLをレスポンスとして返す
8. THE Firebase Functions SHALL 処理完了後に一時ファイルをクリーンアップする

### 要件10: セキュリティとパフォーマンス

**ユーザーストーリー:** 開発者として、セキュアで高速なWebアプリを提供したい。そうすることで、ユーザーに安全で快適な体験を提供できる。

#### 受け入れ基準

1. THE Firebase Functions SHALL CORSを適切に設定する
2. THE Firebase Functions SHALL リクエストレート制限を実装する
3. THE Firebase Storage SHALL 生成されたPDFを24時間後に自動削除する
4. THE Webアプリ SHALL APIキーを環境変数で管理する
5. THE Firebase Functions SHALL 60秒のタイムアウトを設定する
6. THE Firebase Functions SHALL メモリ使用量を最適化する（最大1GB）
