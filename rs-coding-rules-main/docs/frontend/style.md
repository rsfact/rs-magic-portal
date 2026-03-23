# スタイル設計

## 方針

- シンプルかつ統一されたフラットデザイン
- コードの簡潔性を最優先

## デザインルール

- 色: varによる共通化
- パレット: --color-bg(#FAFAFA), --color-black(#333), --color-primary(#799BF9), --color-accent(#FFA775), --color-danger(#FF5151)
- 構造: 単一責任の原則に基づき適切に分割

## フレームワーク

- Tailwind CSSを用いる

## アイコン

- Font Awesome (CDN) を用いる
- <i class="fa-solid fa-xxx"> 形式で記述する
- サイズはTailwindの text-* で制御する
- 色はTailwindの text-[var(--color-*)] で制御する
- アイコン単体で意味を持たせず、必要に応じてラベルテキストを併記する

## タイポグラフィ

- フォントファミリー: システムフォント (font-sans) を基本とする
- フォントサイズ: Tailwindのデフォルトスケール (text-sm, text-base, text-lg 等) に従う
- 行間: 本文は leading-relaxed、見出しは leading-tight を基本とする

## スペーシング

- 余白はTailwindの4pxグリッド (p-1=4px, p-2=8px, p-4=16px ...) に統一する
- コンポーネント間の間隔は gap ユーティリティで制御する

## インタラクション

- ホバー・フォーカス時は transition を付与し、変化を滑らかにする
- フォーカス可能な要素には必ず :focus-visible スタイルを設定する（アクセシビリティ確保）
- ボタン等の操作要素には cursor-pointer を明示する

## レスポンシブ

- モバイルファーストで設計する
- ブレークポイントはTailwindデフォルト (sm, md, lg, xl) を用いる

## 角丸・影

- 角丸: カード等のコンテナには rounded-lg、ボタン等の小要素には rounded-md を基本とする
- 影: フラットデザインを基調とし、浮遊表現が必要な場合のみ shadow-sm を控えめに用いる
