# マジックログイン機能 要件定義

ポータルから外部アプリを起動するとき、NFC カードのタッチで「別ユーザーとしてログインしたトークン」を自動付与する機能。

## 削除した経緯

iOS Safari は Web NFC API (`NDEFReader`) をサポートしていない。マジックログインを ON にした iOS 端末では、`is_send_token_enabled` のアプリ起動ボタンを押すと NFC モーダルが即座に "ブラウザ非対応" で閉じ、起動が実質失敗する。デバイス検出やフォールバックを入れるより、一旦削除して仕切り直すことにした。

### 発生した不具合の詳細

- 症状: ホーム画面の一番上(=シールドアイコン付きアプリ)の「起動」ボタンを iOS で何度タップしても反応しない。アニメ完了後・複数タップでも変わらず。
- 原因: `getUrl()` が `show_nfc_modal()` を呼び、`NDEFReader` 不在で即 null 返却 → `window.open` まで到達しない。一瞬 `#status` に "このブラウザはNFCに対応していません。" と出るだけで、起動ボタン自体は無反応に見える。
- なぜ「一番上だけ」: `is_send_token_enabled = true` のアプリが上位にあり、それ以外のアプリは分岐で素直に URL を開くため影響を受けなかった。
- なぜ「端末によって」: マジックログインを ON にした iOS 端末でのみ発火。Android Chrome では NFC が動作するため問題が表面化しなかった。OFF の iOS では handoff フローに進むため動く。

## 実装上の注意点

- **Web NFC API は Android Chrome (HTTPS) のみ対応**。iOS Safari、iOS Chrome (実体は WebKit)、PC ブラウザはいずれも `NDEFReader` が未実装。MDN や [Can I use - Web NFC](https://caniuse.com/webnfc) で最新状況を確認すること。
- 非対応環境で機能を露出させない設計が必須:
    - トグル UI は `"NDEFReader" in window` をチェックしてから描画する、または disable する。
    - 万一 ON のまま非対応端末で開かれた場合、起動ボタンを押しても黙って失敗するのではなく、モーダル/ダイアログで「この端末では使えません」と明示する。
- マジックログインの ON/OFF を**端末側ローカルストレージのみ**で管理すると、対応端末でトグルした設定が非対応端末に持ち越されない代わりに、共有端末での切り忘れリスクが残る。サーバー側に持つかは要件次第。
- 削除前のバグは「ロジック側でフォールバックしないと無反応に見える」という UX 設計上の事故。再実装時は **失敗パスでも必ずユーザーに見える反応を返す** ことを徹底する。

## 想定ユースケース

- 受付端末・店頭タブレットなど、共有端末で複数ユーザーが入れ替わる環境。
- 管理者が自端末でマジックログインを ON にし、来訪者の NFC カードをタッチさせて、その来訪者として外部アプリを開かせる。
- 通常の自分用端末では OFF にしておけば、自分のトークンが渡る(従来の handoff フロー)。

## 全体フロー

1. 管理者が管理画面 (`admin.html`) でマジックログインを **ON** にする → 端末のローカルストレージにフラグが立つ。
2. ホーム (`index.html`) でアプリの「起動」ボタンを押す。
3. アプリが `is_send_token_enabled = true` の場合のみ、NFC モーダルが開きカードタッチを待つ。
4. NFC カードの URL から user_id を抽出し、バックエンドに impersonate トークンを発行させる。
5. その短命トークンを URL ハッシュに付与してアプリを別タブで開く。
6. アプリ側は `#token=...` を受け取り、`/auth/handoff` で自分のトークンに変換してログイン状態を確立する。

`is_send_token_enabled = false` のアプリは NFC を介さず URL を直接開く(マジックログインの対象外)。
マジックログイン **OFF** の端末では、`is_send_token_enabled = true` のアプリでも自分の handoff トークンが渡る(impersonate しない)。

## データ仕様

### ローカルストレージ

| キー | 値 | 設定箇所 |
|---|---|---|
| `mgp_is_enable_magic_login` | `"1"` (有効時のみ) / 未設定 (無効) | `admin.html` のトグル |

トグル OFF 時はキー自体を `removeItem` する(値 `"0"` 等で残さない)。

### NFC カード

カードには以下のいずれかの NDEF レコードを書き込む:

- `recordType: "url"` のレコードに、ユーザーID 抽出可能な URL を格納
- `recordType: "text"` のレコードに、上記 URL 文字列を格納

URL から user_id を抽出する正規表現は `config.js` の `NFC_USER_ID_PATTERN` で定義する。例:

```js
export const NFC_USER_ID_PATTERN = /^https:\/\/rdr\.rsfact\.com\/u\/([a-f0-9-]+)$/;
```

第1キャプチャグループが user_id (UUID 等) として抽出される。

### アプリの `is_send_token_enabled` フラグ

各アプリ(`/v1/apps`)に既に存在するブール属性。マジックログインが無くてもこのフラグは別目的(handoff トークン付与)で利用されるため、削除しないこと。

## UI 仕様

### 管理画面: マジックログイン トグル

- 配置: `admin.html` のヘッダー右側、ホームリンクの隣
- ラベル: アイコン `fa-wand-magic-sparkles` + "マジックログイン"
- ON/OFF で文字色をプライマリ⇄スレートに切り替え
- 変更時に `mgp_is_enable_magic_login` をローカルストレージに反映
- ページロード時にローカルストレージからチェック状態を復元

### ホーム画面: NFC モーダル

- 全画面オーバーレイ (`fixed inset-0 z-50`、半透明黒背景 + 背景ブラー)
- 中央に白カード:
  - WiFi アイコン(45° 回転)
  - 見出し "マジックカードをタッチ"
  - ステータステキスト("待機中..." / "カードを読み取れませんでした" 等)
  - キャンセルボタン
- 起動ボタン押下で表示、カード読み取り成功 or キャンセルで閉じる

### 起動ボタンの分岐ロジック

```
if (!app.url) → 何もしない
else if (!app.is_send_token_enabled) → app.url をそのまま開く
else if (マジックログイン ON) → NFC モーダル → impersonate トークン → URL に付与して開く
else → handoff トークン (自分用) → URL に付与して開く
```

## バックエンドI/F

`/auth/impersonate` エンドポイントはバックエンドに残してある(`backend/app/api/auth/router.py`、`backend/app/usecases/auth.py`)。再実装時はそのまま使える。

- リクエスト: `{ user_id: string, expire_minutes: number }` + 管理者の Bearer トークン
- レスポンス: `{ token: string, user: {...} }`
- 権限: ADMIN (自テナント内のみ) / VENDOR (全テナント)
- トークン寿命: 短命を推奨(従来は 1 分)。共有端末で意図せず長時間有効化することを防ぐ。

## セキュリティ・運用上の注意

- **トークン寿命**: impersonate トークンは短命(数十秒〜1分)に留める。長くするとカードを盗まれた際のリスクが増える。
- **NFC URL の検証**: 正規表現で固定ドメインに限定し、任意 URL から user_id を抽出しない。
- **ブラウザ対応**:
    - Web NFC API は **Android Chrome 限定** (HTTPS 必須)。
    - iOS Safari、PC ブラウザでは `NDEFReader` が `window` に存在しない。
    - 再実装時は対応端末以外でトグル UI を出さない、もしくは押下時に明確なエラー表示を行うこと。

## 旧コードの所在 (削除前)

| 機能 | ファイル | 備考 |
|---|---|---|
| NFC モーダル HTML | `web/index.html` | `#nfc-modal` ブロック |
| NFC スキャン処理 | `web/index.js` | `show_nfc_modal()` |
| impersonate API 呼び出し | `web/index.js` | `impersonate_login()` |
| 起動分岐ロジック | `web/index.js` | `getUrl()` 内 |
| トグル状態 | `web/admin.js` | `isMagicLoginEnabled` / `toggleMagicLogin()` |
| トグル UI | `web/admin.html` | ヘッダー右の checkbox |
| URL パターン定数 | `web/config.js`, `config.js.example` | `NFC_USER_ID_PATTERN` |

git 履歴を辿れば実装そのものを参照できる。

## 再実装時の改善余地

- iOS 等の非対応端末では、トグル自体を無効化 or 非表示にする(現行は ON にできてしまうが起動時に失敗する)。
- impersonate 失敗時のフィードバックを `set_status` 以外にも(モーダル内に)出す。
- カードタッチ後の遷移を視覚的に明示(成功アニメ等)。
- マジックログイン ON 中はホーム画面に常時インジケータを出し、運用者に状態を意識させる。
