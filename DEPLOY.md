# v0.1.1への更新とGitHub Pagesへの反映

想定するGitHubリポジトリ:

```text
https://github.com/Epsilon-Lab-Atelier/voronoi-field-lab
```

公開URL:

```text
https://epsilon-lab-atelier.github.io/voronoi-field-lab/
```

## 1. 現在のv0.1.0を確認する

```bash
cd "$HOME/Dropbox/share_data/open_material/EpsilonLab/local_repo/voronoi_lab/v0.1.0"

git status --short
git pull --ff-only
```

`git status --short` に何も表示されず、v0.1.0の変更がすべてpush済みであることを確認します。

## 2. ZIPを親フォルダへ展開する

```bash
cd "$HOME/Dropbox/share_data/open_material/EpsilonLab/local_repo/voronoi_lab"
unzip "$HOME/Downloads/Voronoi-Field-Lab-v0.1.1.zip"
```

展開後は次のようになります。

```text
voronoi_lab/
  v0.1.0/
  v0.1.1/
```

## 3. Git履歴をv0.1.1へ移す

v0.1.0の作業ツリーを残したまま、Git管理情報だけを新しい版へ移します。

```bash
cd "$HOME/Dropbox/share_data/open_material/EpsilonLab/local_repo/voronoi_lab"

mv v0.1.0/.git v0.1.1/.git
cd v0.1.1
```

確認します。

```bash
git status --short
git remote -v
git config --local --get user.name
git config --local --get user.email
```

作者名とメールが次であることを確認します。

```text
EpsilonLab
310764549+Epsilon-Lab-Atelier@users.noreply.github.com
```

## 4. 公開前チェックとローカル確認

```bash
./scripts/preflight.sh
./scripts/serve-local.sh
```

ブラウザで `http://localhost:8000/` を開き、次を確認します。

- Epsilon Labのロゴとヘッダーが表示される
- 「2点の境界」を選べる
- 「巣を中心にした縄張りモデル」と表示される
- サンプルごとに観察ポイントが変わる
- 点を追加または移動すると「自由配置」になる
- 点の追加、移動、削除、Undo、最寄り調査、PNG保存が動く

確認後、ターミナルで `Control + C` を押します。

## 5. コミットしてpushする

```bash
git add -A
git status --short
git commit -m "Release v0.1.1: improve preset learning guides"
git push origin main
```

macOSのキーチェーンにHTTPS認証が保存済みなら、通常はユーザー名やPATの再入力は不要です。

## 6. 任意でタグを付ける

```bash
git tag -a v0.1.1 -m "Voronoi Field Lab v0.1.1"
git push origin v0.1.1
```

## 7. 公開後の確認

GitHub Pagesはmainブランチの更新後に自動で再公開されます。

```text
https://epsilon-lab-atelier.github.io/voronoi-field-lab/
```

ブラウザに旧版が残る場合は、強制再読み込みを行います。

- macOS Chrome: `Command + Shift + R`
- Safari: 開発メニューからキャッシュを空にして再読み込み
