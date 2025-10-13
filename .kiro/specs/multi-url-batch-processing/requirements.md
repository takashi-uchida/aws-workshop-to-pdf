# Requirements Document

## Introduction

このドキュメントは、Web to PDF Converterツールに複数URLの同時処理機能を追加するための要件を定義します。現在のツールは単一URLまたは単一サイトの複数ページ変換に対応していますが、複数の異なるURLを一度に処理する機能がありません。この機能により、ユーザーは複数のWebページやサイトを効率的にバッチ処理でPDF化できるようになります。

また、デフォルトモードを複数ページモード（multi）に変更し、ファイル名をページタイトルから自動生成する機能を追加します。

## Requirements

### Requirement 1: 複数URLの入力対応

**User Story:** As a ユーザー, I want ファイルから複数のURLを読み込める機能, so that 複数のWebページを個別に実行することなく効率的にPDF化できる

#### Acceptance Criteria

1. WHEN ユーザーがCLIで複数のURLを指定する THEN システムは各URLを個別に処理してPDFを生成する SHALL
2. WHEN ユーザーがファイルから複数のURLを読み込む THEN システムは各URLを順次処理する SHALL
3. WHEN ユーザーが`--url-file`オプションでURLリストファイルを指定する THEN システムはファイルから各行のURLを読み込んで処理する SHALL
4. WHEN ユーザーが`-u`オプションで単一URLを指定する THEN システムは従来通り単一URLとして処理する SHALL

### Requirement 2: バッチ処理の実行制御

**User Story:** As a ユーザー, I want バッチ処理の進行状況を確認できる機能, so that 処理の状態を把握し、問題が発生した場合に対処できる

#### Acceptance Criteria

1. WHEN バッチ処理が開始される THEN システムは処理対象のURL総数を表示する SHALL
2. WHEN 各URLの処理が開始される THEN システムは現在処理中のURL番号と総数を表示する SHALL
3. WHEN 各URLの処理が完了する THEN システムは成功/失敗のステータスと出力ファイル名を表示する SHALL
4. WHEN 処理中にエラーが発生する THEN システムはエラーメッセージを表示し、次のURLの処理を継続する SHALL
5. WHEN すべての処理が完了する THEN システムは成功数、失敗数、処理時間のサマリーを表示する SHALL

### Requirement 3: デフォルトモードの変更

**User Story:** As a ユーザー, I want デフォルトで複数ページモードが有効になる, so that サイト全体を変換する際に毎回`-m multi`を指定する手間を省ける

#### Acceptance Criteria

1. WHEN ユーザーが`-m`オプションを指定しない THEN システムは`multi`モードで動作する SHALL
2. WHEN ユーザーが`-m single`を明示的に指定する THEN システムは単一ページモードで動作する SHALL
3. WHEN ユーザーが`-m multi`を明示的に指定する THEN システムは複数ページモードで動作する SHALL

### Requirement 4: タイトルベースのファイル名生成

**User Story:** As a ユーザー, I want PDFファイル名がページタイトルから自動生成される, so that ファイル名から内容を識別しやすくなる

#### Acceptance Criteria

1. WHEN システムがページをPDF化する THEN システムはページの`<title>`タグからファイル名を生成する SHALL
2. WHEN タイトルに使用できない文字が含まれる THEN システムは安全なファイル名に変換する SHALL（スラッシュ、コロン、特殊文字を削除または置換）
3. WHEN タイトルが取得できない THEN システムはURLベースのファイル名にフォールバックする SHALL
4. WHEN ファイル名が長すぎる THEN システムは適切な長さ（例：100文字）に切り詰める SHALL
5. WHEN 同じファイル名が既に存在する THEN システムは連番を付加して重複を回避する SHALL
6. WHEN ユーザーが`-o`オプションでファイル名を明示的に指定する THEN システムは指定されたファイル名を使用する SHALL

### Requirement 5: バッチ処理の出力管理

**User Story:** As a ユーザー, I want 複数URLの処理結果が整理されて保存される, so that 生成されたPDFファイルを管理しやすくなる

#### Acceptance Criteria

1. WHEN バッチ処理が実行される AND 出力ディレクトリが指定されていない THEN システムは`output/batch_YYYYMMDD_HHMMSS/`形式のディレクトリを作成する SHALL
2. WHEN バッチ処理が実行される AND 出力ディレクトリが指定されている THEN システムは指定されたディレクトリに保存する SHALL
3. WHEN 各URLの処理が完了する THEN システムは生成されたPDFをバッチディレクトリ内に保存する SHALL
4. WHEN バッチ処理が完了する THEN システムは処理結果のサマリーをJSON形式で保存する SHALL（URL、ステータス、ファイル名、エラーメッセージを含む）

### Requirement 6: エラーハンドリングと継続性

**User Story:** As a ユーザー, I want 一部のURLで処理が失敗しても他のURLの処理が継続される, so that バッチ処理全体が中断されることなく完了できる

#### Acceptance Criteria

1. WHEN 特定のURLで処理が失敗する THEN システムはエラーをログに記録し、次のURLの処理を継続する SHALL
2. WHEN ネットワークエラーが発生する THEN システムは最大3回までリトライする SHALL
3. WHEN タイムアウトが発生する THEN システムはエラーとして記録し、次のURLに進む SHALL
4. WHEN 無効なURLが指定される THEN システムはスキップして次のURLに進む SHALL

### Requirement 7: 既存機能との互換性

**User Story:** As a 既存ユーザー, I want 既存のCLIオプションと動作が維持される, so that 既存のスクリプトやワークフローが引き続き動作する

#### Acceptance Criteria

1. WHEN ユーザーが単一URLを`-u`オプションで指定する THEN システムは従来通り動作する SHALL
2. WHEN ユーザーが既存のオプション（`-s`, `-w`, `-d`, `--format`など）を使用する THEN システムは各URLの処理に同じ設定を適用する SHALL
3. WHEN ユーザーがレガシースクリプト（`npm run legacy-single`など）を実行する THEN システムは従来通り動作する SHALL
