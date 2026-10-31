---
marp: true
theme: mgp
paginate: true
---

<!-- _class: cover -->
<!-- _paginate: skip -->

<div class="cover-row">
<img src="../logo.png" alt="">
<h1>気が利くポータル、<br><strong>マジックポータル</strong>。</h1>
</div>

AI駆動開発を支える、社内SE向け支援キット

---

# マジックポータルとは

## 社内のアプリが、ひとつの入口につながります。

<div class="hub">
<svg>
<line x1="568" y1="220" x2="200" y2="75" stroke="#D9DCE3" stroke-width="2"/>
<line x1="568" y1="220" x2="120" y2="220" stroke="#D9DCE3" stroke-width="2"/>
<line x1="568" y1="220" x2="200" y2="365" stroke="#D9DCE3" stroke-width="2"/>
<line x1="568" y1="220" x2="936" y2="75" stroke="#D9DCE3" stroke-width="2"/>
<line x1="568" y1="220" x2="1016" y2="220" stroke="#D9DCE3" stroke-width="2"/>
<line x1="568" y1="220" x2="936" y2="365" stroke="#D9DCE3" stroke-width="2"/>
</svg>
<div class="hub-center"><img src="../logo.png" alt="">マジックポータル</div>
<div class="hub-node" style="left:200px;top:75px"><i class="fa-solid fa-clock"></i>勤怠アプリ</div>
<div class="hub-node alt" style="left:120px;top:220px"><i class="fa-solid fa-pen-to-square"></i>日報アプリ</div>
<div class="hub-node" style="left:200px;top:365px"><i class="fa-solid fa-receipt"></i>経費申請アプリ</div>
<div class="hub-node" style="left:936px;top:75px"><i class="fa-solid fa-calendar-days"></i>共有カレンダー</div>
<div class="hub-node alt" style="left:1016px;top:220px"><i class="fa-solid fa-comment-dots"></i>ボイス伝言板</div>
<div class="hub-node soon" style="left:936px;top:365px"><i class="fa-solid fa-plus"></i>新しいアプリ</div>
</div>

---

# 画面イメージ

## ふだん使うのは、この1画面だけ。

<div class="win">
<div class="win-top"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="url"><i class="fa-solid fa-lock"></i>portal.example.com</span><i class="fa-solid fa-star mark"></i></div>
<div class="mock-bar">
<span class="brand"><img src="../logo.png" alt="">マジックポータル</span>
<span class="acts"><i class="fa-solid fa-gear"></i><i class="fa-solid fa-right-from-bracket"></i></span>
</div>
<div class="mock-grid">
<div class="mcard"><i class="fa-solid fa-clock"></i><div class="nm">シンプル勤怠</div><div class="ds">出退勤の打刻と集計</div><div class="go">開く</div></div>
<div class="mcard alt"><i class="fa-solid fa-pen-to-square"></i><div class="nm">かんたん日報</div><div class="ds">日報の作成と共有</div><div class="go">開く</div></div>
<div class="mcard"><i class="fa-solid fa-receipt"></i><div class="nm">経費申請</div><div class="ds">申請から承認まで</div><div class="go">開く</div></div>
<div class="mcard"><i class="fa-solid fa-calendar-days"></i><div class="nm">共有カレンダー</div><div class="ds">予定の共有</div><div class="go">開く</div></div>
<div class="mcard alt"><i class="fa-solid fa-comment-dots"></i><div class="nm">ボイス伝言板</div><div class="ds">音声の伝言を共有</div><div class="go">開く</div></div>
<div class="mcard"><i class="fa-solid fa-robot"></i><div class="nm">メールアシスタントAI</div><div class="ds">返信文の下書き</div><div class="go">開く</div></div>
</div>
</div>

<p class="pt">マジックポータルの気が利く点を、3つ、ご紹介します。</p>

---

<!-- _class: section -->

<i class="fa-solid fa-table-cells-large bg-icon l"></i>

# その1

## アプリがまとまる

---

<!-- _class: ask -->

# こんなこと、ありませんか？

## アプリを導入するたびに、URLを配って<br>全員にブックマークしてもらっていませんか？

<div class="story">
<div class="actor"><span class="face"><i class="fa-solid fa-user-tie"></i></span><b>管理者</b></div>
<div class="talk">
<p>新しいアプリを入れました。<br>このURLをブックマークしてください。</p>
<code>https://expense.example.com/</code>
</div>
<div class="crowd">
<div class="row"><span class="face sm"><i class="fa-solid fa-user"></i></span><span class="status"><i class="fa-solid fa-star"></i>登録した</span></div>
<div class="row"><span class="face sm"><i class="fa-solid fa-user"></i></span><span class="status"><i class="fa-solid fa-star"></i>登録した</span></div>
<div class="row"><span class="face sm"><i class="fa-solid fa-user"></i></span><span class="status ng">あれ、どこだっけ…？</span></div>
</div>
</div>

<p class="cap">アプリが増えるたびに、配る手間と「どこだっけ？」の問い合わせも増えていきます。</p>

---

# その1　アプリがまとまる

## ブックマークは「マジックポータル」ひとつだけ。

<div class="devices">
<div class="monitor">
<div class="screen">
<div class="mini">
<div class="mini-bar"><span class="brand"><img src="../logo.png" alt="">マジックポータル</span><span class="acts"><i class="fa-solid fa-gear"></i><i class="fa-solid fa-right-from-bracket"></i></span></div>
<div class="mini-grid">
<div class="mini-card"><i class="fa-solid fa-clock"></i>シンプル勤怠<span class="go">開く</span></div>
<div class="mini-card alt"><i class="fa-solid fa-pen-to-square"></i>かんたん日報<span class="go">開く</span></div>
<div class="mini-card"><i class="fa-solid fa-receipt"></i>経費申請<span class="go">開く</span></div>
<div class="mini-card alt"><i class="fa-solid fa-calendar-days"></i>共有カレンダー<span class="go">開く</span></div>
<div class="mini-card"><i class="fa-solid fa-comment-dots"></i>ボイス伝言板<span class="go">開く</span></div>
<div class="mini-card alt"><i class="fa-solid fa-robot"></i>メールアシスタントAI<span class="go">開く</span></div>
</div>
</div>
</div>
<span class="stand"></span><span class="base"></span>
</div>
<div class="phone">
<span class="notch"></span>
<div class="screen">
<div class="mini">
<div class="mini-bar"><span class="brand"><img src="../logo.png" alt="">マジックポータル</span></div>
<div class="mini-grid one">
<div class="mini-card row"><i class="fa-solid fa-clock"></i>シンプル勤怠</div>
<div class="mini-card row alt"><i class="fa-solid fa-pen-to-square"></i>かんたん日報</div>
<div class="mini-card row"><i class="fa-solid fa-receipt"></i>経費申請</div>
<div class="mini-card row alt"><i class="fa-solid fa-calendar-days"></i>共有カレンダー</div>
</div>
</div>
</div>
</div>
</div>

- ブックマークも案内も**ポータルひとつ**。中身は管理者がいつでも書き換えられます
- スマホの**ホーム画面にも追加**できます

---

# その1　アプリがまとまる

## Chrome拡張機能で、シームレスに。

<div class="duo">
<figure>
<div class="win page">
<div class="win-top"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="url"><i class="fa-solid fa-lock"></i>go-gle.example.com</span></div>
<div class="page-body google">
<div class="g-logo"><span class="b">G</span><span class="r">o</span><span> </span><span class="b">g</span><span class="gr">l</span><span class="r">e</span></div>
<div class="g-search"><i class="fa-solid fa-magnifying-glass"></i><span></span><i class="fa-solid fa-microphone"></i></div>
<div class="g-buttons"><span></span><span></span></div>
<div class="ripple"><span></span><span></span><span></span><i class="fa-solid fa-arrow-pointer"></i></div>
</div>
</div>
<figcaption>マウスを右下の波紋に近づけると…</figcaption>
</figure>
<figure>
<div class="win page">
<div class="win-top"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="url"><i class="fa-solid fa-lock"></i>go-gle.example.com</span></div>
<div class="page-body google">
<div class="g-logo"><span class="b">G</span><span class="r">o</span><span> </span><span class="b">g</span><span class="gr">l</span><span class="r">e</span></div>
<div class="g-search"><i class="fa-solid fa-magnifying-glass"></i><span></span><i class="fa-solid fa-microphone"></i></div>
<div class="g-buttons"><span></span><span></span></div>
<div class="fan">
<span class="sub"><i class="fa-solid fa-clock"></i></span>
<span class="sub"><i class="fa-solid fa-pen-to-square"></i></span>
<span class="sub"><i class="fa-solid fa-receipt"></i></span>
<span class="main"><i class="fa-solid fa-wand-magic-sparkles"></i></span>
</div>
</div>
</div>
<figcaption>そのままランチャーが開き、どのアプリへも移動できます</figcaption>
</figure>
</div>

<p class="pt">作業中のどの画面からでも。<strong>ポータルを開く必要すらありません</strong>。</p>

---

<!-- _class: section -->

<i class="fa-solid fa-key bg-icon r"></i>

# その2

## ログインがまとまる

---

<!-- _class: ask -->

# こんなこと、ありませんか？

## アプリごとにIDとパスワードが違い、<br>問い合わせがシステム管理者に集まっていませんか？

<div class="around">
<div class="login a"><span class="head">勤怠システム</span><span class="field">ID</span><span class="field">パスワード</span><span class="btn">ログイン</span></div>
<div class="login b"><span class="head">日報ツール ログイン</span><span class="field">メールアドレス</span><span class="field">パスワード</span><span class="btn">サインイン</span></div>
<div class="login c"><span class="head">経費精算</span><span class="field">社員番号</span><span class="field">パスワード</span><span class="btn">ログイン</span></div>
<div class="person"><i class="fa-solid fa-user"></i></div>
<div class="bubble-q">？</div>
</div>

<p class="cap">アプリが5つあれば、IDとパスワードも5組。管理が煩雑で、たまに忘れます。</p>

---

# その2　ログインがまとまる

## ログインはポータルで1回。<br>アプリへは、30秒の通行証で自動ログインします。

<div class="flow">
<div class="win node">
<div class="mini-bar"><span class="brand"><img src="../logo.png" alt="">マジックポータル</span><span class="acts"><i class="fa-solid fa-gear"></i><i class="fa-solid fa-right-from-bracket"></i></span></div>
<div class="node-body">
<span class="tile"><i class="fa-solid fa-clock"></i>シンプル勤怠</span>
<span class="press"><i class="fa-solid fa-arrow-pointer"></i> 開く</span>
</div>
</div>
<div class="handover"><span class="ticket"><i class="fa-solid fa-ticket"></i>通行証</span><span class="life">30秒で失効</span></div>
<div class="win node">
<div class="win-top"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="url">https://app.example.com/</span></div>
<div class="node-body app">
<span class="hello"><i class="fa-solid fa-circle-check"></i>こんにちは、佐藤 さん</span>
<span class="punch"><b class="in">出勤</b><b class="out">退勤</b></span>
</div>
</div>
</div>

- 「開く」を押すと、**本人証明の通行証**(JWTトークン)が発行され、URLに乗ってアプリへ渡ります
- アプリは通行証を確かめて、自動でログイン。

<p class="note">具体的なインターフェースは、付録に記載しています。</p>

---

# その2　ログインがまとまる

<div class="dev">
<div class="mono">
<div class="lump">
<span></span><span></span><span></span><span></span><span></span>
<i class="fa-solid fa-xmark x"></i>
</div>
<p class="lb">ひとつの大きなシステムを作り込む</p>
</div>
<i class="fa-solid fa-arrow-right-long dev-arrow"></i>
<div class="many">
<div class="portal-bar"><img src="../logo.png" alt="">マジックポータル<small>入口とログインを引き受け</small></div>
<div class="links"><span></span><span></span><span></span><span></span></div>
<div class="apps">
<span><i class="fa-solid fa-clock"></i>勤怠</span>
<span><i class="fa-solid fa-pen-to-square"></i>日報</span>
<span><i class="fa-solid fa-receipt"></i>経費</span>
<span class="next"><i class="fa-solid fa-plus"></i>次のアプリ</span>
</div>
<p class="lb">小さなアプリを、作っては足していく</p>
</div>
</div>

<p class="pt">社内アプリは独立して開発し、ログインだけまとまる。<br><span class="sub">コードが肥大化しないため、快適にAI駆動開発を進められます。</span></p>

---

<!-- _class: section -->

<i class="fa-solid fa-tablet-screen-button bg-icon l"></i>

# その3

## 共用タブレットでも使える

---

# その3　共用タブレットでも使える

## NFCカード(マジックカード)のタッチだけで、<br>本人としてログインできます。

<div class="touch-row">
<div class="key-card">
<div class="key-face">
<span class="top"><span class="chip"></span><i class="fa-solid fa-wifi"></i></span>
<img src="../logo.png" alt="">
</div>
<b>社員一人に、一枚。</b>
</div>
<div class="touch"><i class="fa-solid fa-wifi"></i><span>タッチ</span></div>
<div class="tablet">
<span class="cam"></span>
<div class="screen">
<div class="mini-bar"><span class="brand"><img src="../logo.png" alt="">マジックポータル</span></div>
<div class="tiles three">
<span class="tile tall"><i class="fa-solid fa-comment-dots"></i>ボイス伝言板<b>タッチでログイン</b></span>
<span class="tile tall alt"><i class="fa-solid fa-pen-to-square"></i>かんたん日報<b>タッチでログイン</b></span>
<span class="tile tall"><i class="fa-solid fa-calendar-days"></i>共有カレンダー<b>タッチでログイン</b></span>
</div>
</div>
</div>
</div>

- PCもスマホも持たない現場でも、事務所の**共用タブレット1台**で始められます
- IDもパスワードも覚えずに、**カード1枚で本人としてログイン**。勤怠の打刻も日報も、タッチするだけになります

---

## 料金

<i class="fa-solid fa-coins bg-icon r"></i>

<div class="price">
<div class="plan">
<div class="plan-head">基本プラン</div>
<div class="plan-price"><small>月額</small><b>1.5</b><span>万円</span><span class="per">／30名まで</span></div>
<div class="plan-sub">初期費用 30万円　※31名以上は +500円/人</div>
<ul class="feat">
<li><i class="fa-solid fa-circle-check"></i>社内アプリの入口(ポータル)</li>
<li><i class="fa-solid fa-circle-check"></i>一時的な通行証による自動ログイン</li>
<li><i class="fa-solid fa-circle-check"></i>マジックログイン(カード認証)</li>
<li><i class="fa-solid fa-circle-check"></i>Chrome拡張ランチャー</li>
</ul>
</div>
<p class="note">※マジックカード(ログイン用カードキー)は、1,000円/枚です。<br>※付録の技術仕様に合わせることで、自社の開発アプリも追加できます。</p>
</div>

---

# まとめ

## マジックポータルで、DXを軽やかに。

<div class="sum">
<div><span class="no">その1</span><i class="fa-solid fa-table-cells-large"></i><b>アプリがまとまる</b><p>これだけブックマークしてもらえば、あとはアプリを追加するだけ。</p></div>
<div class="alt"><span class="no">その2</span><i class="fa-solid fa-key"></i><b>ログインがまとまる</b><p>ログイン情報が連携され、アプリには自動ログイン。覚えるID/PWは1つだけ。</p></div>
<div><span class="no">その3</span><i class="fa-solid fa-id-card"></i><b>共用タブレットでも使える</b><p>PC・スマホを持たない社員さんも、マジックカードでログインできます。</p></div>
</div>

<p class="pt">さあ、社内アプリをどんどんリリースしましょう！</p>

---

<!-- _class: section -->

<i class="fa-solid fa-code bg-icon l"></i>

## 付録

---

<!-- _class: appendix -->

# 付録　連携インターフェース仕様

## 次の2点を満たすアプリは、言語やフレームワークを問わず掲載できます。

<div class="api-flow">
<span class="an"><i class="fa-solid fa-wand-magic-sparkles"></i>マジックポータル</span>
<span class="al"><code>#token=&lt;JWT&gt;</code> 付きURLで起動<i class="fa-solid fa-arrow-right-long"></i></span>
<span class="an"><i class="fa-solid fa-window-maximize"></i>アプリ(画面)</span>
<span class="al">JWTを交換APIへ送信<i class="fa-solid fa-arrow-right-long"></i></span>
<span class="an"><i class="fa-solid fa-server"></i>アプリ(API)</span>
<span class="al">クレームを解析<i class="fa-solid fa-arrow-right-long"></i></span>
<span class="an okay"><i class="fa-solid fa-circle-check"></i>自前のセッション</span>
</div>

- **受け取り**：ポータルはアプリ起動時、URL末尾に `#token=<JWT>` を付与して開く。アプリは起動直後にこれを読み取り、ただちにURLから除去する
- **交換**：読み取ったJWTを自アプリのAPIで検証し、クレームを解析して自アプリのユーザーへ引き当て、自前のセッションを発行する。転送用JWTの有効期限は30秒(マジックログイン経由は1分)

<p class="note">例として、提供アプリの交換APIは次の形です。</p>

```text
POST /auth/handoff
Authorization: Bearer <URLで受け取ったJWT>

200 → { "token": "<自アプリのトークン>", "user": { ... } }
401 → 署名の不正・期限切れ
```

<p class="note">トークンを使わないアプリは、単なるリンクとしても掲載できます。</p>
