# Changelog

## [Unreleased] - 2026-04-16

### Fixed
- `Mapper 'Mapper[User(users)]' has no property 'apps'` エラーを修正
  (`app/models/auth.py`)。
  `App` モデルが `back_populates="apps"` を宣言していたが、`User` / `Tenant`
  側に対応する `apps` リレーションシップが無かったため、SQLAlchemy のマッパー
  構成時に例外となっていた。両モデルに `apps` リレーションを追加。

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
