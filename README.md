# Web to PDF Converter

Playwrightを使用して任意のWebページをPDFに変換する汎用ツール

## 特徴

- 🌐 **任意のURLに対応**: AWS Workshop、ドキュメントサイト、ブログなど任意のWebページをPDF化
- 📄 **単一/複数ページ変換**: 1ページのみまたはサイト全体を自動巡回して変換
- 🔄 **バッチ処理**: 複数の異なるURLを一度に処理してPDF化
- 🎯 **柔軟なセレクター**: ナビゲーションリンクのCSSセレクターをカスタマイズ可能
- 📐 **PDFフォーマット設定**: 用紙サイズ、向き、余白などをカスタマイズ
- ⏱️ **待機時間調整**: 動的コンテンツの読み込みを待つ時間を調整可能
- 📝 **自動ファイル名生成**: ページタイトルから自動的にファイル名を生成

## インストール

```bash
cd tools/aws-workshop-to-pdf
npm install
```

## 使用方法

### CLIコマンド

```bash
node cli.js [options]
```

### 主なオプション

| オプション | 説明 | デフォルト |
|-----------|------|------------|
| `-u, --url <url>` | 変換するURL | - |
| `--url-file <path>` | URLリストファイルのパス（複数URL処理用） | - |
| `-m, --mode <mode>` | 変換モード: `single`または`multi` | `multi` |
| `-o, --output <path>` | 出力ファイルパス | 自動生成 |
| `-s, --selector <selector>` | ナビゲーションリンクのCSSセレクター | `a` |
| `-w, --wait <ms>` | ページ読み込み待機時間（ミリ秒） | `3000` |
| `-d, --delay <ms>` | ページ間の待機時間（ミリ秒） | `2000` |
| `--format <format>` | PDFフォーマット: `A4`または`Letter` | `A4` |
| `--landscape` | 横向きで出力 | false |
| `--no-background` | 背景を除外 | false |
| `--no-images` | 画像を除外 | false |
| `--lazy-load` | 遅延読み込みコンテンツをスクロール | false |

### 使用例

#### 1. 単一ページをPDFに変換

```bash
# 基本的な使い方
node cli.js -u https://example.com

# 出力ファイル名を指定
node cli.js -u https://example.com -o output/example.pdf

# 横向きで背景なし
node cli.js -u https://example.com --landscape --no-background
```

#### 2. サイト全体を複数ページPDFに変換

```bash
# すべての<a>タグのリンクを辿る（デフォルト）
node cli.js -u https://example.com -m multi

# 特定のナビゲーションリンクのみ辿る
node cli.js -u https://docs.example.com -m multi -s "nav a"

# 遅延読み込みコンテンツを含める
node cli.js -u https://blog.example.com -m multi --lazy-load
```

#### 3. AWS Workshopの変換

```bash
# AWS SaaS Operations Workshop全体を変換
node cli.js -u https://catalog.workshops.aws/saas-operations/en-US \
  -m multi \
  -s 'nav a[href^="/"]' \
  -w 5000 \
  --lazy-load

# または npm スクリプトを使用
npm run convert-workshop
```

#### 4. ドキュメントサイトの変換

```bash
# サイドバーのリンクを辿って変換
node cli.js -u https://docs.example.com/guide \
  -m multi \
  -s ".sidebar a" \
  -w 2000 \
  -o docs/guide.pdf
```

#### 5. 複数URLのバッチ処理

```bash
# URLリストファイルから複数のURLを一度に処理
node cli.js --url-file urls.txt

# 出力ディレクトリを指定
node cli.js --url-file urls.txt -o output/batch

# 各URLを単一ページモードで処理
node cli.js --url-file urls.txt -m single
```

**URLリストファイルの形式（urls.txt）:**

```
# 1行に1つのURLを記述
# #で始まる行はコメントとして無視されます

https://example.com
https://docs.example.com/guide
https://blog.example.com/article-1

# 空行も無視されます

https://another-site.com
```

**バッチ処理の出力:**

- デフォルトでは`output/batch_YYYYMMDD_HHMMSS/`ディレクトリに保存
- 各PDFファイルはページタイトルから自動生成されたファイル名で保存
- 処理結果のサマリーが`batch_summary.json`として保存される

```
output/
└── batch_20250114_153045/
    ├── Example_Domain.pdf
    ├── Documentation_Guide.pdf
    ├── Blog_Article_Title.pdf
    ├── Another_Site_Homepage.pdf
    └── batch_summary.json
```

## NPMスクリプト

package.jsonに定義されているショートカット：

```bash
# CLIツールを起動（デフォルトはmultiモード）
npm run convert

# 単一ページモードで起動
npm run convert-single

# 複数ページモードで起動（明示的）
npm run convert-multi

# バッチ処理（urls.txtから複数URL読み込み）
npm run convert-batch

# AWS Workshopの変換（プリセット）
npm run convert-workshop
```

## レガシースクリプト（後方互換性）

以前のバージョンの固定URLスクリプトも利用可能：

```bash
# AWS Workshop固定URL - 単一ページ
npm run legacy-single

# AWS Workshop固定URL - 全ページ
npm run legacy-multi
```

## 出力

- デフォルトでは`output/`ディレクトリに保存
- ファイル名形式：
  - 単一ページ: ページタイトルから自動生成（例: `Example_Page_Title.pdf`）
  - 複数ページ（マージ版）: `{ドメイン名}_complete_YYYYMMDD_HHMMSS.pdf`
  - 複数ページ（個別）: `000_page_title.pdf`, `001_page_title.pdf`など
  - バッチ処理: `output/batch_YYYYMMDD_HHMMSS/`ディレクトリ内に各PDFとサマリーファイル

## 高度な設定

### CSSセレクターの例

```bash
# クラス名で選択
-s ".navigation a"

# ID内のリンク
-s "#sidebar a"

# 特定の属性を持つリンク
-s 'a[data-nav="true"]'

# 複数セレクター
-s "nav a, .sidebar a"

# 特定のパスパターン
-s 'a[href^="/docs/"]'
```

### PDFカスタマイズ

```bash
# Letter サイズ、横向き、余白指定
node cli.js -u https://example.com \
  --format Letter \
  --landscape \
  --margin-top 20 \
  --margin-bottom 20 \
  --margin-left 15 \
  --margin-right 15
```

### パフォーマンス調整

```bash
# 遅いサイトの場合
node cli.js -u https://slow-site.com \
  -w 10000 \      # 10秒待機
  -d 5000 \       # ページ間5秒待機
  --lazy-load     # スクロールして遅延読み込み
```

## トラブルシューティング

### PDFのマージができない場合
```bash
# pdf-libが必要
npm install pdf-lib
```

### ブラウザが起動しない場合
```bash
# Playwrightのブラウザを再インストール
npx playwright install chromium
```

### タイムアウトエラーの場合
- `-w`オプションで待機時間を増やす
- `-d`オプションでページ間の待機時間を増やす
- `--lazy-load`オプションを有効にする

### リンクが正しく検出されない場合
- ブラウザの開発者ツールで正しいCSSセレクターを確認
- `-s`オプションで適切なセレクターを指定

### メモリ不足の場合
- 複数ページモードでページ数が多すぎる場合は、個別のPDFとして保存（マージを無効化）
- または、サイトを部分的に変換

### バッチ処理で一部のURLが失敗する場合
- 処理は継続され、成功したURLのPDFは生成される
- `batch_summary.json`で失敗したURLとエラー原因を確認
- 失敗したURLは個別に再実行するか、待機時間を調整して再試行

## 制限事項

- ログインが必要なページは非対応（認証機能は未実装）
- JavaScriptで動的に生成される一部のコンテンツは取得できない場合がある
- 無限スクロールのページは完全に対応していない
- 大量のページ（100ページ以上）の場合はメモリ使用量に注意

## ライセンス

MIT