# ルータールール

- RESTful原則に準拠する。
- 基本的には body jsonを用いる。
    - リソース指定のみ、パスパラメータとする。
    - クエリパラメータは基本的に使用しないが、form-dataの場合は仕方がないので使用する。
- 複数取得の場合には、GETではなく、POST /search エンドポイントを用いる。
    - paginationを用いる。
- router関数のdoc stringのみ、日本語でMarkdown箇条書きとする。
    - その際、エンジニア向けの最も抽象的な表現で、強調などせず、文字数が少ないほど良いものとする。
- その他、サンプルコードを参考にして、設計思想を準拠する。
- router関数はすべて同期関数(def)とし、summary引数やdocstringによるコメントは記載しない。
- レスポンスは BaseResponse.create_success(result) を使用してラップして返却する。

