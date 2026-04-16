# Changelog

## [Unreleased] - 2026-04-16

### Fixed
- `Mapper 'Mapper[User(users)]' has no property 'apps'` エラーを修正
  (`app/models/auth.py`)。
  `App` モデルが `back_populates="apps"` を宣言していたが、`User` / `Tenant`
  側に対応する `apps` リレーションシップが無かったため、SQLAlchemy のマッパー
  構成時に例外となっていた。両モデルに `apps` リレーションを追加。
- `app/usecases/app.py` で `AttributeError: 'ResUserGet' object has no attribute 'tenant'`
  を修正。`user.tenant.id` → `user.tenant_id` (5箇所)。`ResUserGet` は Pydantic
  スキーマで `tenant_id` フィールドのみを持ち、`tenant` リレーションは持たない。
- `frontend/web/index.js` の `refresh_token` が送っていたフィールド名を
  `expire_hours` → `expire_seconds` に修正 (バックエンドのスキーマと一致させた)。

### Changed
- 認証系エンドポイントのパスを整理:
  - `/api/auth/users/login`   → `/api/auth/login`
  - `/api/auth/users/refresh` → `/api/auth/refresh`
  - `/api/auth/users/me`      → `/api/auth/me`
- 上記に伴い `frontend/web` を新パスへ追従 (`login.js`, `admin.js`, `index.js`)。

### Added (Temporary / Deprecated)
- 後方互換のための旧パス (`/api/auth/users/login`, `/users/refresh`, `/users/me`)
  を `app/api/auth/router_legacy.py` として別ファイルで再導入。
  - OpenAPI からは非表示 (`include_in_schema=False`)、`deprecated=True`。
  - **経緯:** Chrome 拡張機能は既にリリース済みで、旧パスを叩く旧バージョンが
    ユーザー環境に残っているため、拡張機能の配布更新が行き渡るまでは旧パスも
    受け付ける必要がある。
  - **TODO:** 拡張機能更新の浸透を確認後、`router_legacy.py` とその include を
    削除する。
- `frontend/chrome` (`launcher.js`, `popup.js`) に一時的なフォールバックを追加。
  まず `/auth/users/*` を叩き、`404`/`405` の場合のみ `/auth/*` に再試行する。
  拡張機能が更新された環境では後者のみが使われるようになる。

### Changed (Frontend)
- 自動ログイン (`is_send_token_enabled`) 時に URL へ付与するトークンを、
  `expire_seconds=30` で `refresh` して発行した短命トークンに変更。
  - `frontend/web/index.js` は `refresh_token(30)` を使用。
  - `frontend/chrome/launcher.js` の `refreshToken` は `expire_seconds: 30` を
    第一選択とし、失敗時に旧互換の `expire_hours: 1` にフォールバックする。

### Chore
- ルートに `.gitignore` は置かず、`frontend/.gitignore` を新規作成して
  `web/config.js` とエディタ/OS系の一時ファイルを除外対象に追加。
- 誤ってコミットされていた `frontend/web/config.js` を `git rm --cached` で
  追跡解除 (`config.js.example` はテンプレートとして残存)。

### TODO
- [ ] Chrome 拡張機能の配布更新が行き渡ったら、`backend/app/api/auth/router_legacy.py`
      と `backend/app/api/router.py` の legacy ルーター include を削除する。
- [ ] 同上のタイミングで、`frontend/chrome/launcher.js` / `popup.js` の
      `/auth/users/*` → `/auth/*` のパスフォールバックを削除する。
- [ ] 同上のタイミングで、`frontend/chrome/launcher.js` の `refreshToken` から
      `expire_hours: 1` フォールバックを削除し、`expire_seconds: 30` のみにする。
