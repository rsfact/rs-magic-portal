# マジックログイン機能 要件定義

ポータルから外部アプリを起動するとき、NFC マジックカードのタッチで「別ユーザーとしてログインしたトークン」を自動付与する機能。

## 想定ユースケース

- 受付端末・店頭タブレットなど、共有端末で複数ユーザーが入れ替わる環境。
- 管理者が自端末でマジックログインを ON にし、来訪者の NFC カードをタッチさせて、その来訪者として外部アプリを開かせる。
- 通常の自分用端末では OFF にしておけば、自分のトークンが渡る(従来の handoff フロー)。
- NFC カードは **マジックカード兼名刺カード**。マジックログイン待機中でない通常のスマホでタッチすれば、カード所有者の自己紹介ページ(`rdr` パラメータ)へ転送される名刺として機能する。

## 二系統の読み取り方式

カードに何を書き込むかは運用ポリシーで決め、`config.js` の `NFC_DATA_IS_URL` で**明示的に**宣言する。フォールバック(暗黙判定)はしない。

| `NFC_DATA_IS_URL` | カード内容 | 読み取り経路 | 必要環境 |
|---|---|---|---|
| `true` | URL (例: `https://mgp.rsfact.app/ui/index.html?u={uuid}&rdr={encoded}`) | OS の URL ハンドラ → 着地ページの JS が処理 | OS の NFC URL ハンドラさえあれば動く(iOS Safari でも可) |
| `false` | テキスト or URL (任意の NDEF レコード) | Web NFC API (`NDEFReader`) でモーダル内完結 | Android Chrome (HTTPS) 限定 |

タブレット端末は運用者側で選定する前提のため、どちらのモードでも要件は満たせる。

## URL 経由方式 (`NFC_DATA_IS_URL = true`)

### カードに書き込む URL

```
https://mgp.rsfact.app/ui/index.html?u={user-id}&rdr={url-encoded-personal-page}
```

例:

```
https://mgp.rsfact.app/ui/index.html?u=4874aea8-cde6-4563-a0a7-18b7e87d2c7b&rdr=https%3A%2F%2Flinks.rsfact.com%2Fu%2Fryohei-suzuki
```

- `u`: マジックログインで impersonate するユーザー ID (UUID 等)
- `rdr`: マジックログイン待機中**でない**ときに転送する自己紹介ページ URL
- URL の書き込みは別ツールで行う。`config.js` は読み取り専用。`rdr` を含めすべてのフィールドはこちらが書き込み、ユーザーは変更できない前提。

### 待機フラグ

ホーム画面 (`index.html`) で `is_send_token_enabled = true` のアプリの起動ボタンを押した瞬間、ローカルストレージに以下を保存する。

| キー | 値 |
|---|---|
| `mgp_magic_login_pending` | `{ "app_url": "...", "expires_at": <unix-ms> }` |

- `app_url`: 起動しようとしたアプリの URL(カードタッチ後に impersonate トークンを付けて開く先)
- `expires_at`: 起動ボタン押下から 60 秒後(目安)
- 起動ボタン押下時のみ書き込む。期限切れ・キャンセル・成功時には削除する。

### 着地ロジック (`index.html` の起動時)

URL クエリに `?u=...` が含まれていたら **着地モード** として処理する。

```
const u = query.u
const rdr = query.rdr
if (u && NFC_DATA_IS_URL) {
  const pending = readPendingFlag()
  if (pending && pending.expires_at > now) {
    // マジックログイン待機中
    impersonate(u, expire_minutes=1)
      → location.replace(pending.app_url + "#token=" + jwt)
    deletePendingFlag()
  } else {
    // 通常の名刺タッチ
    deletePendingFlag()  // 期限切れなら掃除
    if (rdr) location.replace(rdr)
    else show("待機中ではありません")
  }
}
```

- 待機フラグはタッチ元タブと OS が開いた新タブで**同一オリジン localStorage を共有**するため読める。
- 待機フラグの有効期限切れ時は `rdr` に転送するか index に戻すかは運用次第(初期実装は `rdr` 転送)。
- 起動元のホーム画面タブは、`storage` イベントでフラグ削除を検知し NFC モーダルを閉じる。実装が複雑なら手動キャンセルでも可(YAGNI)。

### 起動ボタンの分岐ロジック

```
if (!app.url) → 何もしない
else if (!app.is_send_token_enabled) → app.url をそのまま開く
else if (マジックログイン ON) → 待機フラグ立てる + NFC モーダル表示 (OS のカードタッチを待つ)
else → handoff トークン (自分用) → URL に付与して開く
```

`NFC_DATA_IS_URL = true` の場合、Web NFC API は使わず純粋に OS まかせ。モーダルはユーザーへの「タッチを待っています」表示と、キャンセル経路のためだけに表示する。

## Web NFC API 経由方式 (`NFC_DATA_IS_URL = false`)

カードに URL ではないテキスト(生 UUID、ID 文字列など)を書く運用。

- 起動ボタン押下時に NFC モーダル表示 + `NDEFReader.scan()` を起動
- 読み取ったレコード(URL or text) を `NFC_USER_ID_PATTERN` にマッチさせ、キャプチャグループ 1 を user_id として impersonate
- 着地ページ・待機フラグは**不要**
- 端末は Android Chrome (HTTPS) 必須。非対応端末ではトグル UI を出さない or disable する

## データ仕様

### 環境変数 (`config.js`)

```js
export const API_BASE_URL = "https://mgp.rsfact.app/mgp/api";

// 着地 URL(またはテキスト)から user_id を抽出する正規表現。
// キャプチャグループ 1 が user_id。
export const NFC_USER_ID_PATTERN = /^https:\/\/mgp\.rsfact\.app\/ui\/index\.html\?u=([a-f0-9-]+)/;

// true: NFC カードに URL を書き込む運用。OS の URL ハンドラ経由で着地ページに到達する。
// false: NFC カードに任意テキスト(または URL)を書く運用。Web NFC API でモーダル内完結。
export const NFC_DATA_IS_URL = true;
```

### ローカルストレージ

| キー | 値 | 設定箇所 |
|---|---|---|
| `mgp_is_enable_magic_login` | `"1"` (有効時のみ) / 未設定 (無効) | `admin.html` のトグル |
| `mgp_magic_login_pending` | `{ app_url, expires_at }` の JSON (`NFC_DATA_IS_URL = true` 時のみ) | `index.html` の起動ボタン押下時 |

OFF/削除時はキー自体を `removeItem` する(値 `"0"` 等で残さない)。

### アプリの `is_send_token_enabled` フラグ

各アプリ(`/v1/apps`)に既に存在するブール属性。マジックログイン無効時の handoff トークン付与にも使われるので、削除しないこと。

## UI 仕様

### 管理画面: マジックログイン トグル

- 配置: `admin.html` のヘッダー右側、ホームリンクの隣
- ラベル: アイコン `fa-wand-magic-sparkles` + "マジックログイン"
- ON/OFF で文字色をプライマリ⇄スレートに切り替え
- 変更時に `mgp_is_enable_magic_login` をローカルストレージに反映
- ページロード時にローカルストレージからチェック状態を復元
- `NFC_DATA_IS_URL = false` のときは `"NDEFReader" in window` チェックで非対応端末ではトグルを disable する。`true` のときは端末判定不要(OS まかせ)

### ホーム画面: NFC モーダル

- 全画面オーバーレイ (`fixed inset-0 z-50`、半透明黒背景 + 背景ブラー)
- 中央に白カード:
  - WiFi アイコン(45° 回転)
  - 見出し "マジックカードをタッチ"
  - ステータステキスト("待機中..." / "カードを読み取れませんでした" 等)
  - キャンセルボタン
- 起動ボタン押下で表示、カード読み取り成功 or キャンセルで閉じる
- `NFC_DATA_IS_URL = true` のとき: モーダルは「タッチ待ち」の視覚表示。`storage` イベントで待機フラグ削除を検知して自動で閉じる(または手動キャンセル)
- `NFC_DATA_IS_URL = false` のとき: モーダル内で `NDEFReader.scan()` を起動、読み取り成功で即 impersonate → 別タブで起動

## バックエンドI/F

`/auth/impersonate` エンドポイントは既存のものを使う(`backend/app/api/auth/router.py`、`backend/app/usecases/auth.py`)。

- リクエスト: `{ user_id: string, expire_minutes: number }` + 管理者の Bearer トークン
- レスポンス: `{ token: string, user: {...} }`
- 権限: ADMIN (自テナント内のみ) / VENDOR (全テナント)
- トークン寿命: 短命を推奨(1 分)。共有端末で意図せず長時間有効化することを防ぐ。

## セキュリティ・運用上の注意

- **トークン寿命**: impersonate トークンは 1 分以内に留める。長くするとカードを盗まれた際のリスクが増える。
- **rdr のホワイトリスト**: カードへの書き込みは運用者が制御するためオープンリダイレクトのリスクは低いが、念のため `rdr` を表示前にドメイン照合してもよい。
- **NFC URL のドメイン固定**: `NFC_USER_ID_PATTERN` は固定ドメインで始まる正規表現にし、任意 URL から user_id を抽出しない。
- **待機フラグの expires_at**: 起動ボタン押下後にカードがタッチされないまま端末を放置した場合、`expires_at` を必ず見て、期限切れなら通常の名刺挙動(rdr 転送)に戻す。残置フラグで他人のカードで意図せず impersonate が走る事故を防ぐ。
- **失敗パスの可視化**: impersonate 失敗・期限切れ・パターン不一致など、どの失敗経路もユーザーに見える反応(モーダル内ステータス or 着地ページ表示)を返すこと。「無反応」UX は再発させない。

## 旧コードからの差分

`b8fcbe0` 以前は Web NFC API 一本(`NFC_DATA_IS_URL = false` 相当)で実装されていた。`044e3ed` (revert) でその実装は戻っているので、その上に以下を追加する:

1. `config.js` / `config.js.example` に `NFC_DATA_IS_URL` 定数を追加
2. `index.js` 起動時の着地ロジック(`?u=...` をクエリから読み、待機フラグ判定 → impersonate or `rdr` 転送)
3. `index.js` 起動ボタン押下時の待機フラグ書き込み(`NFC_DATA_IS_URL = true` のときだけ)
4. `index.js` NFC モーダルの `storage` イベント連携(`NFC_DATA_IS_URL = true` のときだけ、`NDEFReader` の代わり)
5. `admin.js` トグルの端末判定を `NFC_DATA_IS_URL` で分岐

旧 Web NFC 経路 (`NFC_DATA_IS_URL = false`) は既存のまま残し、フラグで切り替えるだけにする。
