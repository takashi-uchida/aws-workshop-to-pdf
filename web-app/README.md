# Web to PDF Converter

ブラウザベースのWeb to PDFコンバーター - ソフトウェアのインストール不要でWebページをPDFに変換できます。

## 🌟 特徴

- **インストール不要**: ブラウザから直接アクセスして使用可能
- **単一URL変換**: 個別のWebページを素早くPDF化
- **バッチ変換**: 複数のURLを一度に処理
- **カスタマイズ可能**: ページサイズ、向き、余白などを設定可能
- **完全クライアントサイド**: すべての処理がブラウザ内で完結
- **レスポンシブデザイン**: モバイル、タブレット、デスクトップに対応

## 🚀 使用方法

### オンラインで使用

GitHub Pagesでホストされているアプリケーションにアクセス:
```
https://yourusername.github.io/web-to-pdf-converter/
```

### 単一URL変換

1. 「単一URL」タブを選択
2. 変換したいWebページのURLを入力
3. 必要に応じてPDF設定を調整
4. 「PDFに変換」ボタンをクリック
5. ブラウザの印刷ダイアログでPDFとして保存

### バッチ変換

1. 「バッチ変換」タブに切り替え
2. 複数のURLを1行に1つずつ入力
3. 「バッチ変換開始」ボタンをクリック
4. 各URLが順次処理されます
5. 各ページの印刷ダイアログでPDFとして保存

### PDF設定

「PDF設定」パネルを展開して以下をカスタマイズ:

- **ページサイズ**: A4、Letter、Legal
- **向き**: 縦向き、横向き
- **余白**: 上下左右の余白を個別に設定
- **背景印刷**: 背景色と画像を含めるかどうか

設定は自動的にlocalStorageに保存され、次回アクセス時に復元されます。

## ⚠️ 制限事項

### CORS制限

CORS（Cross-Origin Resource Sharing）は、ブラウザのセキュリティ機能です。異なるドメインのWebページにアクセスする際に制限がかかります。

#### CORS制限が発生する場合

- このツールとは異なるドメインのページを変換しようとした場合
- 対象のWebサイトがCORSヘッダーを設定していない場合
- HTTPSとHTTPが混在している場合

#### 対処方法

1. **同一ドメインのページを使用**: このツールと同じドメインでホストされているページは問題なく動作します
2. **ブラウザ拡張機能を使用**: 「CORS Unblock」などの拡張機能でCORS制限を一時的に無効化できます（開発用途のみ推奨）
3. **プロキシサービスを利用**: CORSプロキシサービスを経由してアクセスします
4. **サーバー側で対応**: 対象のWebサイトの管理者に、適切なCORSヘッダーの設定を依頼します

### その他の制限

- **手動操作が必要**: ブラウザの印刷ダイアログは手動で操作する必要があります
- **完全自動化不可**: ブラウザのセキュリティ制限により、完全自動でのPDFダウンロードは不可能です
- **動的コンテンツ**: JavaScriptで動的に生成されるコンテンツの完全な制御は困難な場合があります

## 💻 ローカル開発

### 前提条件

- モダンなWebブラウザ（Chrome、Firefox、Edge、Safari）
- ローカルWebサーバー（開発用）

### セットアップ

1. リポジトリをクローン:
```bash
git clone https://github.com/yourusername/web-to-pdf-converter.git
cd web-to-pdf-converter/web-app
```

2. ローカルサーバーを起動:

**Python 3を使用:**
```bash
python -m http.server 8000
```

**Node.jsを使用:**
```bash
npx http-server -p 8000
```

**VS Codeを使用:**
- Live Server拡張機能をインストール
- `index.html`を右クリックして「Open with Live Server」を選択

3. ブラウザでアクセス:
```
http://localhost:8000
```

### ファイル構成

```
web-app/
├── index.html              # メインHTMLファイル
├── css/
│   └── styles.css          # スタイルシート
├── js/
│   ├── app.js              # アプリケーションメインロジック
│   ├── converter.js        # PDF変換ロジック
│   ├── batch.js            # バッチ処理ロジック
│   └── utils.js            # ユーティリティ関数
├── test-validation.js      # 自動検証テストスクリプト
├── test-single-url.html    # 単一URL変換テストページ
├── test-11.2-runner.html   # タスク11.2テストランナー
├── check-integration.html  # 統合チェックページ
├── run-validation-tests.html # 検証テスト実行ページ
├── TESTING_GUIDE.md        # テストガイド
└── README.md               # このファイル
```

### 開発のヒント

- **デバッグ**: ブラウザの開発者ツール（F12）でコンソールログを確認
- **CORS問題のテスト**: ローカルサーバーを使用してCORS制限をシミュレート
- **レスポンシブテスト**: ブラウザの開発者ツールでデバイスエミュレーションを使用

## 🧪 テスト

このプロジェクトには、機能を検証するための複数のテストツールが含まれています。

### 自動検証テスト

`test-validation.js`は、Utilsモジュールの各関数を自動的にテストするスクリプトです。

#### テスト内容

1. **URL検証関数**: 有効/無効なURLの判定
2. **エラーメッセージ生成**: 各エラータイプのメッセージ生成
3. **設定バリデーション**: PDF設定の妥当性チェック
4. **ブラウザ互換性チェック**: 必要な機能のサポート確認
5. **URLリストパース**: 複数URLの解析とフィルタリング
6. **HTMLエスケープ**: XSS攻撃の防止
7. **ブラウザ情報取得**: ブラウザ名、バージョン、OS情報
8. **推奨ブラウザチェック**: 推奨環境の確認

#### 実行方法

**ブラウザコンソールで実行:**
```javascript
// test-validation.jsを読み込んだ後
runValidationTests();
```

**専用テストページで実行:**
```
http://localhost:8000/run-validation-tests.html
```

#### テスト結果

テストは以下の情報を出力します:
- 各テストの成功/失敗状態
- 総テスト数、成功数、失敗数
- 成功率
- 失敗したテストの詳細

### 手動テストツール

#### 1. 統合チェック (`check-integration.html`)

すべてのモジュールが正しく読み込まれ、統合されているかを確認します。

**チェック項目:**
- Utilsモジュールの読み込み
- PDFConverterクラスの定義
- BatchProcessorクラスの定義
- Appクラスの定義
- DOM要素の存在
- ブラウザ互換性
- localStorage機能

**アクセス:**
```
http://localhost:8000/check-integration.html
```

#### 2. 単一URL変換テスト (`test-single-url.html`)

単一URL変換機能の自動テストを実行します。

**テスト内容:**
- Utils関数の動作確認
- PDFConverterのインスタンス化
- Appクラスの初期化
- デフォルト設定の読み込み

**アクセス:**
```
http://localhost:8000/test-single-url.html
```

#### 3. タスク11.2テストランナー (`test-11.2-runner.html`)

タスク11.2（単一URL変換の動作確認）の手動テスト手順を提供します。

**テストケース:**
- 有効なURLでの変換テスト
- 無効なURLでのエラーハンドリング
- 印刷ダイアログの表示確認

**アクセス:**
```
http://localhost:8000/test-11.2-runner.html
```

### テストガイド

詳細なテスト手順については、[TESTING_GUIDE.md](TESTING_GUIDE.md)を参照してください。

### テスト実行のベストプラクティス

1. **ローカルサーバーを使用**: `file://`プロトコルではなく、必ずHTTPサーバー経由でアクセス
2. **ブラウザキャッシュをクリア**: テスト前にキャッシュをクリアして最新のコードを確認
3. **複数ブラウザでテスト**: Chrome、Firefox、Edge、Safariで動作を確認
4. **開発者ツールを活用**: コンソールでエラーやログを確認
5. **レスポンシブテスト**: 異なる画面サイズでUIを確認

## 🌐 GitHub Pagesへのデプロイ

### 手順

1. GitHubリポジトリの「Settings」に移動
2. 左サイドバーの「Pages」を選択
3. 「Source」で「Deploy from a branch」を選択
4. 「Branch」で`main`ブランチと`/web-app`フォルダを選択
5. 「Save」をクリック

数分後、アプリケーションが以下のURLで公開されます:
```
https://yourusername.github.io/repository-name/
```

### カスタムドメイン（オプション）

1. `web-app/`ディレクトリに`CNAME`ファイルを作成
2. カスタムドメイン名を記述（例: `pdf.example.com`）
3. DNSプロバイダーでCNAMEレコードを設定

## 🛠️ 技術スタック

- **HTML5**: セマンティックマークアップ
- **CSS3**: レスポンシブデザイン、Flexbox/Grid
- **Vanilla JavaScript (ES6+)**: フレームワーク不要、軽量
- **Browser Print API**: `window.print()`を使用したPDF生成

## 📋 ブラウザ互換性

このアプリケーションは、モダンブラウザの標準機能のみを使用しているため、高い互換性を実現しています。

### サポート状況

| ブラウザ | サポート状況 | テスト済み | 備考 |
|---------|------------|-----------|------|
| Chrome  | ✅ 完全サポート | ✅ | 推奨ブラウザ |
| Firefox | ✅ 完全サポート | ✅ | 推奨ブラウザ |
| Edge    | ✅ 完全サポート | ✅ | 推奨ブラウザ（Chromiumベース） |
| Safari  | ✅ 完全サポート | ✅ | 推奨ブラウザ（macOS/iOS） |

### 必要な機能

- ✅ JavaScript有効
- ✅ localStorage有効
- ✅ iframe対応
- ✅ Print API対応
- ✅ ES6+構文サポート
- ✅ Fetch APIサポート
- ✅ CSS Grid/Flexboxサポート

### ブラウザ互換性テスト

アプリケーションのブラウザ互換性を確認するための専用テストツールを提供しています。

#### 自動テストツール

```
http://localhost:8000/test-browser-compatibility.html
```

このツールは以下をテストします:
- 基本機能（localStorage、iframe、window.print など）
- 高度な機能（CSS Grid、Flexbox、Web APIs など）
- ブラウザ情報の検出
- 自動テスト結果のサマリー表示

#### テストドキュメント

詳細なテスト手順とチェックリストは以下を参照:
- [BROWSER_COMPATIBILITY_TEST.md](BROWSER_COMPATIBILITY_TEST.md) - 手動テストチェックリスト
- [BROWSER_TEST_REPORT.md](BROWSER_TEST_REPORT.md) - テスト結果レポート

### ブラウザ固有の注意事項

#### Chrome
- 最も広く使用されているブラウザ
- 開発者ツールが充実
- すべての機能が完全に動作

#### Firefox
- プライバシー重視のブラウザ
- Web標準への準拠が高い
- すべての機能が完全に動作

#### Edge
- Chromiumベースで高い互換性
- Windows環境で標準ブラウザ
- Chromeと同様の動作を確認

#### Safari
- macOS/iOSで標準ブラウザ
- CORS制限がやや厳格
- すべての機能が正常に動作

### 推奨環境

最良の体験のために、以下の環境を推奨します:
- **ブラウザ**: Chrome、Firefox、Edge、Safari の最新版
- **JavaScript**: 有効化必須
- **Cookie/localStorage**: 有効化推奨（設定保存のため）
- **ポップアップブロック**: 無効化推奨（印刷ダイアログのため）

## 🤝 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🔗 関連リンク

- [GitHub Repository](https://github.com/yourusername/web-to-pdf-converter)
- [Issues](https://github.com/yourusername/web-to-pdf-converter/issues)
- [Pull Requests](https://github.com/yourusername/web-to-pdf-converter/pulls)

## 📞 サポート

問題が発生した場合は、[GitHub Issues](https://github.com/yourusername/web-to-pdf-converter/issues)で報告してください。

---

**注意**: このツールは教育目的およびパーソナルユースを想定しています。商用利用の場合は、対象Webサイトの利用規約を確認してください。
