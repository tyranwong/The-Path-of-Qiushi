# 求是之路 · 西迁1940

浙江大学「素养课」传播实践成果（创意类 · 网页游戏）。纯静态网页，无构建、无依赖，任何静态托管都能跑。

## 目录结构

```
index.html          游戏主页（标题页/剧情卡/结局页/图鉴，单页应用）
关于本作.html       作品信息 + 作者信息 + 声明入口
css/style.css       民国纸张 + 水墨线稿样式
js/game.js          游戏引擎（三值栏 / 卡片 / 结局判定 / 存档 / 图鉴）
data/story.js       剧情数据（当前为占位版，5 张场景卡 + 5 结局）
data/history.js     校史图鉴数据（12 条已核实史料）
assets/             矢量美术资源（西迁路线图.svg、纸张预览.html）
史料/               校史卡素材与出处（研发参考）
AIGC使用声明.md      需作者据实填写并签署
原创性声明.md        需作者本人签署
网页游戏方案.md      方案与排期文档
```

## 本地运行

任选其一：

1. **直接双击 `index.html`**（引擎与数据均用 `<script>` 引入，不依赖网络与 file 协议，可直接打开）。
2. 或起一个静态服务（便于手机同网段访问）：
   ```powershell
   python -m http.server 8080 --bind 0.0.0.0 --directory "D:\传播实践"
   ```
   然后访问 http://127.0.0.1:8080/ 。

## 部署到 GitHub Pages（免费，永久链接）

> 本机已装 git（2.51）。`gh` 命令行未装，直接走「网页建仓 + git push」。

1. 打开 https://github.com/ 登录，点右上角 **+ → New repository**，仓库名随意（如 `qiushi-road-1940`），设为 **Public**，不勾选初始化文件，点 Create。
2. 本地初始化并推送（把下面 URL 换成你的仓库地址）：
   ```powershell
   cd "D:\传播实践"
   git init
   git add index.html 关于本作.html css js data assets AIGC使用声明.md 原创性声明.md README.md
   git commit -m "求是之路·西迁1940 初版"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git push -u origin main
   ```
3. 在仓库页点 **Settings → Pages**，把 Source 的 Branch 选为 **main / (root)**，保存。
4. 等一两分钟，页面会给出访问链接，形如：
   `https://<你的用户名>.github.io/<仓库名>/`
5. 提交作品时，把该链接和二维码一并附上（可搜「草料二维码」免费把链接转成二维码）。

> 注意：`.acl-recovery`、`_docx_text.txt`、`~$...` 等临时文件不要 add 进去（上面 `git add` 已按需指定文件，未包含它们）。若想更干净，可加一个 `.gitignore`：
> ```
> .acl-recovery/
> _docx_text.txt
> ~$*
> ```

## 提交前必做清单

1. 填写作者信息（两处，保持一致）：
   - `data/story.js` 顶部 `meta.author`（有注释占位）
   - `关于本作.html` 的「作者信息」表格（有注释占位）
2. 填写并签署 `原创性声明.md`。
3. 据实填写并签署 `AIGC使用声明.md`（工具、场景、比例、人工修改）。
4. 如需扩充剧情，把 `data/story.js` 里的占位 5 张卡扩到约 18 张（见 `网页游戏方案.md`），`delta` 与 `goto` 规则已写在该文件顶部注释。
