# スキーマルール

- 入出力バリデーションはPydanticで定義する。
- ページネーションは `schemas/base.py` のベースクラスを利用する。
- 必ず実装例を確認する。
- ページネーション時は schemas/base.py を利用する。
- クラス間は2行空ける。
- ResBaseをクラス群の最初に定義し、共通フィールドを持たせる。
- pydantic.Field では title ではなく example を使用する。
- 削除完了などのメッセージレスポンスには ResDelete(msg="...") を使用する。

