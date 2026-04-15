# Lobster Community (Upload Bundle)

这个 `GIT/` 目录是为了上传到 GitHub 生成的“干净源码包”，已排除本地大文件与构建产物（如 `node_modules/`、`dist/`、`release/`）。

## 包含内容

- `apps/openclaw-installer/` Lobster 安装桥（Electron）
- `apps/web/` 社区网站（Vite + React）
- `apps/server/` Demo server（Bun）
- `packages/shared/` 模板与 vendor 注册表
- `.github/workflows/build-installer.yml` CI 构建 Windows `.exe` 与 macOS `.dmg`
- `docs/` 项目文档（含 IM 接入说明）

## 开发

```bash
pnpm install
pnpm --filter lobster-installer dev
pnpm --filter web dev
pnpm --filter server dev
```

## 打包安装器

```bash
pnpm --filter lobster-installer package:mac
pnpm --filter lobster-installer package:win
```

