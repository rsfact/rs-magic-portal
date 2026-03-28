# Magic Portal

売れるポータル。
トイザラスのチラシのように。

## Business Concept

### 逆流効果

ポータルにアプリを集約し、ベンダー都合をユーザー価値に変換する。
未利用アプリの可視化・ロック表示による潜在ニーズ喚起、NFCログイン体験によるMagic Card等の物販需要創出。
ベンダーが届けたいものが、ユーザーにとって便利な形で届く構造。

### アプリ培養

汎用モジュールの具体ユースケースを「1アプリ」として見せる。
例: SpeakHub（汎用音声IF） → 「AI音声日報」として1アプリ化。
1モジュールからN個のアプリを培養し、キャッシュポイントを複製する。

## Architecture & Interface

PocketCore内PocketBaseに依存。

掲載条件: {app_url}#{jwt} でfragment付与されるJWTをLocalStorageへ最優先格納すること。

## Operating Modes

フロントエンド環境変数で切替。

- Normal — ログイン中ユーザーのJWTをfragment付与して遷移
- NFC — NFCタッチ → 環境変数の正規表現でURLからUserID抽出 → 臨時エンドポイントで対象JWTを取得 → fragment付与して遷移

## Permission Model

- User — ポータル利用のみ。管理画面非表示。
- Admin — 管理画面アクセス可。自作アプリのみCRUD。
- Vendor — 管理画面アクセス可。Vendor作成含む全アプリCRUD。

Vendor導入アプリはUser/Adminから保護。各権限は自作分のみ編集可。

## MGP Drawer

Chrome拡張機能。どのサイトでも右下にMagic Portalのアプリランチャーを常駐させる。

マウスが右下隅に近づくとアプリが扇状に展開し、離れると収納される。各アプリはクリックでJWT付きURLとして新しいタブで開く。未認証時はログインボタンのみ表示。

APIからアプリ一覧を取得し、空きスロットはプレースホルダーで埋める。拡張機能のポップアップからBase URL、URLフィルター、有効/無効、ログイン/ログアウトを管理する。

### API

- ログイン: POST {base}/auth/users/login
- アプリ取得: POST {base}/v1/apps/search

## Database

rsfact/rs-db-suiteを用いる。

## API

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
vi .env
python3 -m alembic upgrade head
python3 -m app.main
```

## Frontend

### Web

```bash
cd frontend/web

# Initialize
sudo mkdir -p /usr/share/nginx/html/<server-name>.<domain>/mgp/ui

# If files already exists
sudo rm -rf /usr/share/nginx/html/<server-name>.<domain>/mgp/ui/*

# Copy files
sudo cp -r ./* /usr/share/nginx/html/<server-name>.<domain>/mgp/ui/
```

### Chrome Extension

```bash
cd frontend

# Zip
zip -r /tmp/mgp-drawer.zip chrome/*

# Exit SSH session
exit

# Download from client
scp -i ~/.ssh/keys/<server-name>.secret -P 10034 user@<IP>:/tmp/mgp-drawer.zip .
```

## Nginx

```bash
server {
    listen 80;
    server_name <server-name>.<domain>;

    if ($http_x_forwarded_proto = "http") {
        return 301 https://$server_name$request_uri;
    }

    root /usr/share/nginx/html/<server-name>.<domain>;
    index index.html;

    client_max_body_size 10G;

    location ~ ^/test/?$ {
        add_header Content-Type text/html;
        return 200 'OK';
    }

    location /mgp/api/ {
        proxy_pass http://localhost:8000;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /mgp/ui/ {
        try_files $uri $uri/ /mgp/ui/index.html;
    }
}
```
