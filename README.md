# Voronoi Field Lab

点を置き、動かしながらボロノイ図を学べる、EpsilonLabの無料ブラウザアプリです。

- 登録不要
- 外部通信なし
- PC / スマートフォン対応
- GitHub Pagesでそのまま公開可能
- ZIPを展開してオフラインでも利用可能

## v0.1.0の機能

- クリック / タップで点を追加
- ドラッグで点を移動
- 選択した点の削除
- 元に戻す
- 全消去
- 4種類のサンプル配置
- 3から30点のランダム配置
- ボロノイ図のリアルタイム更新
- 点番号、領域色、面積表示の切り替え
- km / mileの切り替え
- 任意の場所から最寄りの点と距離を確認
- 領域ごとの面積と割合を一覧表示
- PNG画像として保存
- 入力状態の端末内自動保存

## すぐに試す

`index.html` をブラウザで開くだけでも動作します。

より確実に確認する場合は、ローカルサーバーを起動します。

```bash
./scripts/serve-local.sh
```

ブラウザで次を開きます。

```text
http://localhost:8000/
```

## テスト

外部パッケージは不要です。

```bash
npm test
```

## GitHub Pages

公開先として想定しているURL:

```text
https://epsilon-lab-atelier.github.io/voronoi-field-lab/
```

GitHubのリポジトリで以下を設定します。

```text
Settings > Pages
Source: Deploy from a branch
Branch: main
Folder: / (root)
```

## データとプライバシー

入力した点や設定はブラウザの `localStorage` にのみ保存されます。サーバーへの送信、アクセス解析、Cookieはありません。詳細は [PRIVACY.md](PRIVACY.md) を参照してください。

## 利用条件

無料で利用できますが、オープンソースライセンスではありません。授業利用や生成画像の利用条件を含む詳細は [LICENSE.md](LICENSE.md) を参照してください。

## 作者

EpsilonLab

- note: https://note.com/epsilon_lab
