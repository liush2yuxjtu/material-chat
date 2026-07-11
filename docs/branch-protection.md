# `main` 主干保护

在合并本 PR、并让 CI 至少成功运行一次后，到仓库 **Settings → Branches → Add branch protection rule**，为 `main` 配置以下规则。

## 必需设置

- Branch name pattern: `main`
- Require a pull request before merging
  - Required approvals: `1`
  - Dismiss stale pull request approvals when new commits are pushed
  - Require conversation resolution before merging
- Require status checks to pass before merging
  - Require branches to be up to date before merging
  - Required checks:
    - `lint`
    - `typecheck`
    - `prisma`
    - `build`
    - `playwright`
    - `docker-build`
- Require linear history
- Do not allow bypassing the above settings
- Restrict force pushes
- Restrict deletions

## 建议设置

- Allow squash merging，关闭 merge commits；保持主干线性历史。
- 启用自动删除已合并分支。
- 对生产部署另建 GitHub Environment，并启用 required reviewers；不要把生产密钥放进普通 repository variables。

## CI 门禁说明

| Check | 内容 |
|---|---|
| `lint` | ESLint |
| `typecheck` | `tsc --noEmit` |
| `prisma` | Prisma format、validate、generate、migration against PostgreSQL 17 |
| `build` | Next.js production build |
| `playwright` | PostgreSQL 17 + migrations + Chromium E2E；失败时上传报告、截图、视频和 trace |
| `docker-build` | BuildKit 多阶段 production image build，不推送镜像 |

GitHub 只会在 check 至少出现过一次后，才允许从 required status checks 列表中选择它。若某个名称尚未出现，先运行或重新运行本 PR 的 CI。
