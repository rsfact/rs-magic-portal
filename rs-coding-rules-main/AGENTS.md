# コーディングルール

## はじめに

- AIコーディングエージェントは実装前に本ドキュメントを確認し、該当ルールを把握した上で作業を開始すること。
- 以下は目次であり、該当箇所のドキュメントは注意深く観察すること。
- コンテキストを圧迫しないため、関係ないドキュメントは読まないこと。
- また、ユーザとは必ず日本語で対話すること。思考は英語で行って構わない。

## 共通ルール

### 共通

- DRY, KISS, YAGNIを遵守すること。
- 1ファイルあたり100行未満とすること。長くとも300行とし、それを超える場合はユーザにファイル分割を提案すること。
- コード内に、基本的にコメントを書かないこと。
    - ただし、処理の流れを視認しやすくするためのコメントは許可される。
    - その場合、コメントは英語で書く。
    - ToDoコメントは日本語で書く。

### バックエンド

- ファイル冒頭に、""" RS Method"""などと記述がある場合、テンプレートファイルです。cpして利用します。
    - 一部、# Custom Belowなどと書いてある場合がありますが、その場合はその部分のみ修正が必要かもしれません。(例: ユーザ認証用のmodels/auth.pyにおける、ドメインモデルとのrelationなど。)
- 簡素化したクリーンアーキテクチャである。
- python3 .venvを用いる。
- importはアルファベット順で、標準ライブラリ、サードパーティライブラリ、自作モジュールの順に並べ、それぞれ1行ずつ改行する。
- importブロックの後ろは2行改行する。その他、意味上の分かれ目がある場合は2行改行する。

## 個別ルール (目次)

### 共通 (/docs/common/**)

- 命名規則: [naming.md](docs/common/naming.md)

### バックエンド (/docs/backend/**)

- ルーター: [router.md](docs/backend/router.md)
- スキーマ: [schema.md](docs/backend/schema.md)
- サービス層: [service.md](docs/backend/service.md)
- リポジトリ層: [crud.md](docs/backend/crud.md)
- テスト: [test.md](docs/backend/test.md)

### フロントエンド (/docs/frontend/**)

- スタイル: [style.md](docs/frontend/style.md)
- JavaScript: [script.md](docs/frontend/script.md)
