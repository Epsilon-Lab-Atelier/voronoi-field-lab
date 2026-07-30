# GitHub Pagesへの公開手順

想定するGitHubリポジトリ:

```text
https://github.com/Epsilon-Lab-Atelier/voronoi-field-lab
```

公開予定URL:

```text
https://epsilon-lab-atelier.github.io/voronoi-field-lab/
```

## 1. ZIPを展開する

`Voronoi-Field-Lab-v0.1.0.zip` を、次のフォルダ内へ展開します。

```text
$HOME/Dropbox/share_data/open_material/EpsilonLab/local_repo/voronoi_lab/
```

展開後は、次の構成になります。

```text
voronoi_lab/
  v0.1.0/
    index.html
    assets/
    README.md
    ...
```

## 2. 親フォルダのGit設定を確認する

以前 `voronoi_lab` 直下で `git init` を実行している場合、親フォルダに `.git` が残っている可能性があります。バージョンフォルダをGitリポジトリのルートにするため、親の `.git` は一旦バックアップします。

```bash
cd "$HOME/Dropbox/share_data/open_material/EpsilonLab/local_repo/voronoi_lab"

if [ -d .git ]; then
  mv .git .git-parent-backup
fi
```

この操作は削除ではなく名前変更なので、必要なら元に戻せます。初回pushが完了し、親側のGit履歴が不要だと確認できた後に `.git-parent-backup` を削除してください。

## 3. v0.1.0をGitリポジトリとして初期化する

```bash
cd "$HOME/Dropbox/share_data/open_material/EpsilonLab/local_repo/voronoi_lab/v0.1.0"

git init -b main

git config --local user.name "EpsilonLab"
git config --local user.email "310764549+Epsilon-Lab-Atelier@users.noreply.github.com"
```

設定を確認します。

```bash
git config --show-origin --get user.name
git config --show-origin --get user.email
```

どちらも `file:.git/config` から読み込まれていれば、このリポジトリだけに設定されています。

## 4. 公開前チェック

```bash
./scripts/preflight.sh
```

JavaScriptの構文、ボロノイ計算のテスト、公開物に含めたくないローカル情報をまとめて確認します。

ローカル表示も確認できます。

```bash
./scripts/serve-local.sh
```

ブラウザで `http://localhost:8000/` を開きます。終了するときはターミナルで `Control + C` を押します。

## 5. GitHubの空リポジトリへ接続する

```bash
git remote add origin \
  https://github.com/Epsilon-Lab-Atelier/voronoi-field-lab.git

git remote -v
```

すでに `origin` が設定されている場合は、次を使います。

```bash
git remote set-url origin \
  https://github.com/Epsilon-Lab-Atelier/voronoi-field-lab.git
```

## 6. コミットする

```bash
git add .
git status --short
git commit -m "Initial release: v0.1.0"
```

コミット作者を確認します。

```bash
git log -1 --format='%h  %an  <%ae>'
```

次の名義であれば問題ありません。

```text
EpsilonLab <310764549+Epsilon-Lab-Atelier@users.noreply.github.com>
```

## 7. pushする

```bash
git push -u origin main
```

HTTPS認証を求められた場合は、Epsilon-Lab-Atelierアカウントで認証します。ターミナルでパスワードを求められた場合、GitHubの通常パスワードではなく、そのアカウント用のPersonal Access Tokenを使用します。

GitHub側のリポジトリは、READMEやLICENSEを追加していない空の状態を想定しています。

## 8. GitHub Pagesを有効にする

GitHub上で次を開きます。

```text
voronoi-field-lab
  > Settings
  > Pages
```

次のように設定します。

```text
Source: Deploy from a branch
Branch: main
Folder: / (root)
```

保存後、公開が完了すると次のURLで利用できます。

```text
https://epsilon-lab-atelier.github.io/voronoi-field-lab/
```

## 9. 公開後の確認

- PCで点の追加、移動、削除ができる
- スマートフォンでタップとドラッグができる
- km / mileの切り替えで境界が変わらない
- 最寄り調査モードが動く
- PNG保存ができる
- noteへのリンクが開く
- OGPカードに `og-image.png` が表示される
