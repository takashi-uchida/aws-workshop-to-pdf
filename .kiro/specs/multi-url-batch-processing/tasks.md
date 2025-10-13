# Implementation Plan

- [x] 1. デフォルトモードを multi に変更

  - cli.js の Commander オプション定義で`--mode`のデフォルト値を`'single'`から`'multi'`に変更
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 2. File Name Generator Module の実装

  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 2.1 ファイル名サニタイズ関数を実装

  - `sanitizeFileName()`関数を作成し、特殊文字の置換、空白処理、長さ制限を実装
  - _Requirements: 4.2, 4.4_

- [x] 2.2 ページタイトルからファイル名を生成する関数を実装

  - `generateFileNameFromTitle()`関数を作成し、ページタイトル取得とフォールバック処理を実装
  - _Requirements: 4.1, 4.3_

- [x] 2.3 ファイル名の重複回避機能を実装

  - `ensureUniqueFileName()`と`fileExists()`関数を作成し、連番付加ロジックを実装
  - _Requirements: 4.5_

- [x] 2.4 convertPageToPDF()にタイトルベースのファイル名生成を統合

  - 既存の`convertPageToPDF()`関数を拡張し、ページタイトルを取得してファイル名に使用
  - ユーザーが`-o`オプションで明示的に指定した場合は指定されたファイル名を優先
  - _Requirements: 4.1, 4.6_

- [x] 3. URL Resolver Module の実装

  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3.1 ファイルから URL を読み込む関数を実装

  - `readUrlsFromFile()`関数を作成し、ファイルから行単位で URL を読み込み
  - コメント行（#で始まる行）をスキップする処理を追加
  - _Requirements: 1.2, 1.3_

- [x] 3.2 URL 検証関数を実装

  - `validateUrls()`関数を作成し、各 URL の妥当性をチェック
  - 無効な URL に対してエラー情報を返す
  - _Requirements: 1.1, 1.2_

- [x] 3.3 CLI オプションに--url-file を追加

  - Commander に`--url-file`オプションを追加
  - _Requirements: 1.3_

- [ ] 4. Progress Reporter Module の実装

  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 4.1 バッチ処理開始の報告関数を実装

  - `reportStart()`関数を作成し、総 URL 数を表示
  - _Requirements: 2.1_

- [x] 4.2 進行状況報告関数を実装

  - `reportProgress()`関数を作成し、現在の処理番号、URL、ステータスを表示
  - _Requirements: 2.2, 2.3_

- [x] 4.3 サマリー報告関数を実装

  - `reportSummary()`関数を作成し、成功数、失敗数、処理時間を表示
  - _Requirements: 2.5_

- [x] 5. Batch Processor Module の実装

  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4_

- [x] 5.1 BatchProcessor クラスの基本構造を実装

  - コンストラクタ、プロパティ（options, results, startTime, browser）を定義
  - _Requirements: 2.1_

- [x] 5.2 processBatch()メソッドを実装

  - URL 配列を受け取り、各 URL を順次処理
  - ブラウザインスタンスの起動と終了を管理
  - Progress Reporter を使用して進行状況を表示
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 5.3 processUrl()メソッドをリトライロジック付きで実装

  - 単一 URL の処理を最大 3 回リトライ
  - 成功時と失敗時の結果オブジェクトを返す
  - _Requirements: 2.4, 6.2, 6.3_

- [x] 5.4 convertUrl()メソッドを実装

  - モード（single/multi）に応じて適切な変換関数を呼び出し
  - _Requirements: 2.1, 2.2_

- [x] 5.5 generateSummary()メソッドを実装

  - 処理結果から統計情報を生成
  - BatchSummary オブジェクトを返す
  - _Requirements: 2.5_

- [x] 5.6 バッチディレクトリの作成機能を実装

  - `output/batch_YYYYMMDD_HHMMSS/`形式のディレクトリを作成
  - ユーザーが出力ディレクトリを指定した場合はそれを使用
  - _Requirements: 5.1, 5.2_

- [x] 5.7 batch_summary.json の保存機能を実装

  - バッチ処理完了後、サマリー情報を JSON 形式で保存
  - _Requirements: 5.4_

- [x] 6. main()関数の再構成

  - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.1, 7.1, 7.2, 7.3_

- [x] 6.1 URL 入力の解析ロジックを追加

  - `--url-file`オプションが指定された場合はファイルから読み込み
  - `-u`オプションが指定された場合は単一 URL として処理
  - _Requirements: 1.3, 1.4_

- [x] 6.2 URL 検証を追加

  - 解析した URL を検証し、無効な URL を除外
  - 警告メッセージを表示
  - _Requirements: 6.4_

- [x] 6.3 バッチ処理と単一処理の分岐を実装

  - 複数 URL の場合は BatchProcessor を使用
  - 単一 URL の場合は既存の処理フローを使用
  - _Requirements: 1.1, 7.1_

- [x] 6.4 エラーハンドリングを強化

  - バッチ処理中のエラーを適切にキャッチ
  - 処理を継続するか中断するかを判断
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 7. 既存機能との統合とテスト

  - _Requirements: 7.1, 7.2, 7.3_

- [x] 7.1 既存の convertSinglePage()と convertMultiplePages()の互換性を確認

  - 既存の単一 URL 処理が正常に動作することを確認
  - 既存のオプション（-s, -w, -d, --format など）が正常に機能することを確認
  - _Requirements: 7.1, 7.2_

- [x] 7.2 複数 URL での動作確認

  - 2-3 個の URL でバッチ処理をテスト
  - 成功と失敗が混在するケースをテスト
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.5_

- [x] 7.3 エッジケースのテスト

  - 無効な URL を含むリスト
  - 空の URL リストファイル
  - 存在しない URL リストファイル
  - 非常に長いページタイトル
  - 特殊文字を含むページタイトル
  - _Requirements: 4.2, 4.4, 6.4_

- [x] 8. ドキュメントの更新

  - _Requirements: 7.1, 7.2, 7.3_

- [x] 8.1 README.md に複数 URL 機能の説明を追加

  - 使用例とオプションの説明を追加
  - URL リストファイルの形式を説明（1 行に 1URL、#でコメント可能）
  - _Requirements: 1.3_

- [x] 8.2 package.json のスクリプトを更新
  - デフォルトモード変更に伴う説明の更新
  - 新しい使用例を追加
  - _Requirements: 3.1, 3.2, 3.3_
