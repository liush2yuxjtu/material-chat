# Secrets 扫描日志（CI，已脱敏）

- 仓库：`liush2yuxjtu/material-chat`
- 被扫描提交：`d57ea24b25cc8af4990d045006ccf4b1bb8913d2`
- GitHub Actions 运行：[29136505095](https://github.com/liush2yuxjtu/material-chat/actions/runs/29136505095)
- Git 跟踪文件数：`734`
- 已扫描文本文件数：`733`
- 跳过的大文件数（>2 MB）：`0`
- 跳过的二进制文件数：`1`
- 高置信度 secrets：`0`
- 待人工复核候选：`40`

> 报告不会保存匹配到的值，只保存类型、文件、行号和不可逆 SHA-256 指纹前 12 位。

## 高置信度结果

| 文件 | 行 | 类型 | 指纹 |
|---|---:|---|---|
| _未发现_ | — | — | — |

## 待人工复核候选

| 文件 | 行 | 类型 | 指纹 |
|---|---:|---|---|
| `.codex/ecc/upstream/agents/code-reviewer.md` | 270 | `credential-assignment:apikey` | `85030dcccd84` |
| `.codex/ecc/upstream/skills/api-design/SKILL.md` | 307 | `credential-assignment:api-key` | `e9982364fd73` |
| `.codex/ecc/upstream/skills/backend-patterns/SKILL.md` | 108 | `credential-assignment:token` | `38f36846dcfa` |
| `.codex/ecc/upstream/skills/backend-patterns/SKILL.md` | 370 | `credential-assignment:token` | `5d999b7f0433` |
| `.codex/ecc/upstream/skills/clickhouse-io/SKILL.md` | 170 | `credential-assignment:password` | `fa426ad2a524` |
| `.codex/ecc/upstream/skills/data-scraper-agent/SKILL.md` | 226 | `credential-assignment:api_key` | `ceb969f320cb` |
| `.codex/ecc/upstream/skills/django-patterns/SKILL.md` | 354 | `credential-assignment:password` | `1748aef4c852` |
| `.codex/ecc/upstream/skills/django-patterns/SKILL.md` | 377 | `credential-assignment:password` | `8bf16b529f16` |
| `.codex/ecc/upstream/skills/django-patterns/SKILL.md` | 514 | `credential-assignment:token` | `689a7e1e4473` |
| `.codex/ecc/upstream/skills/django-tdd/SKILL.md` | 127 | `credential-assignment:password` | `e4abae53cc1c` |
| `.codex/ecc/upstream/skills/django-tdd/SKILL.md` | 172 | `credential-assignment:password` | `78d266c54630` |
| `.codex/ecc/upstream/skills/kotlin-exposed-patterns/SKILL.md` | 59 | `credential-assignment:password` | `5c96c4373d46` |
| `.codex/ecc/upstream/skills/kotlin-exposed-patterns/SKILL.md` | 79 | `credential-assignment:password` | `5c96c4373d46` |
| `.codex/ecc/upstream/skills/kotlin-exposed-patterns/SKILL.md` | 117 | `credential-assignment:password` | `4ec3da5efdb4` |
| `.codex/ecc/upstream/skills/kotlin-ktor-patterns/SKILL.md` | 278 | `credential-assignment:token` | `933b4bd5802b` |
| `.codex/ecc/upstream/skills/kotlin-ktor-patterns/SKILL.md` | 617 | `credential-assignment:token` | `52c44cd6d549` |
| `.codex/ecc/upstream/skills/mysql-patterns/SKILL.md` | 269 | `credential-assignment:password` | `020a9ff56ba2` |
| `.codex/ecc/upstream/skills/python-testing/SKILL.md` | 247 | `credential-assignment:token` | `114410319ecd` |
| `.codex/ecc/upstream/skills/python-testing/SKILL.md` | 458 | `credential-assignment:api_key` | `a810b891daf7` |
| `.codex/ecc/upstream/skills/quarkus-security/SKILL.md` | 83 | `credential-assignment:token` | `19b54ab285cb` |
| `.codex/ecc/upstream/skills/quarkus-security/SKILL.md` | 281 | `credential-assignment:password` | `e2794d1158af` |
| `.codex/ecc/upstream/skills/redis-patterns/SKILL.md` | 191 | `credential-assignment:token` | `816c14e60567` |
| `.codex/ecc/upstream/skills/scientific-db-pubmed-database/SKILL.md` | 123 | `credential-assignment:api_key` | `ceb969f320cb` |
| `.codex/ecc/upstream/skills/security-review/SKILL.md` | 34 | `credential-assignment:apikey` | `7d6dca494dd7` |
| `.codex/ecc/upstream/skills/security-review/SKILL.md` | 250 | `credential-assignment:token` | `5d999b7f0433` |
| `.codex/ecc/upstream/skills/security-review/cloud-infrastructure-security.md` | 76 | `credential-assignment:apikey` | `85030dcccd84` |
| `.codex/ecc/upstream/skills/springboot-security/SKILL.md` | 42 | `credential-assignment:token` | `a0c0d5e1196e` |
| `.codex/ecc/upstream/skills/springboot-security/SKILL.md` | 160 | `credential-assignment:password` | `1e28d0fd01d0` |
| `.codex/ecc/upstream/skills/videodb/reference/api-reference.md` | 11 | `credential-assignment:api_key` | `a2ae6a9ee724` |
| `.codex/ecc/upstream/skills/videodb/reference/capture-reference.md` | 264 | `credential-assignment:token` | `56e5165f2d34` |
| `prisma/seed.ts` | 23 | `credential-assignment:password` | `e2794d1158af` |
| `scripts/update-pr-evidence.mjs` | 8 | `credential-assignment:token` | `d84c66c7d433` |
| `src/adapters/database/PostgresAdapter.ts` | 29 | `credential-assignment:password` | `5c96c4373d46` |
| `src/app/api/v1/auth/register/route.ts` | 46 | `credential-assignment:password` | `e2794d1158af` |
| `src/app/register/page.tsx` | 45 | `credential-assignment:password` | `96b6963f08ba` |
| `src/app/register/page.tsx` | 111 | `credential-assignment:password` | `68862c732c42` |
| `src/auth.ts` | 73 | `credential-assignment:clientsecret` | `a47c8b6264dd` |
| `src/infrastructure/CompositionRoot.ts` | 85 | `credential-assignment:apikey` | `d49a2e1335d1` |
| `src/infrastructure/CompositionRoot.ts` | 101 | `credential-assignment:password` | `906fc46374e3` |
| `src/infrastructure/CompositionRoot.ts` | 140 | `credential-assignment:apikey` | `ad442755d0fe` |

## 扫描边界

- 此扫描覆盖 GitHub 仓库中当前提交的 Git 跟踪文件。
- 它不会读取开发机上的未跟踪文件、环境变量、操作系统密钥链、Shell 历史或仓库外文件。
- 因此它可以替代“远端仓库 secrets 扫描日志”，但不能证明本地机器不存在未提交的 secrets。
