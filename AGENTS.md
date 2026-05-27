# AGENTS.md

## Build & Verify

```bash
npm run verify     # generate → typecheck → test → build
npm run generate   # 将 src/prompts/*.md 生成为 src/prompts/generated.ts（不提交）
npm run typecheck  # tsc -p tsconfig.json --noEmit
npm test           # vitest run（测试文件：src/__tests__/*.test.ts）
npm run build      # clean + generate + tsc -p tsconfig.build.json
```

**关键**：`src/prompts/generated.ts` 是代码生成的且被 `.gitignore` 忽略。修改 `src/prompts/*.md` 后 **必须先跑 `npm run generate`** 否则 typecheck 和 build 会失败。

## 架构

- 这是一个 OpenCode 插件（npm 包 `opencode-empire`），依赖 `@opencode-ai/plugin`
- 入口：`src/index.ts`（插件服务端模块）、`src/cli.ts`（CLI 安装脚本）
- ESM 项目（`"type": "module"`），TypeScript strict mode，`noUncheckedIndexedAccess: true`
- 构建产物到 `dist/`，`tsconfig.build.json` 排除测试文件
- 配置文件路径：`~/.config/opencode/opencode-empire.json`，合并时 tuple config 优先

## Agent 设计

- 11 个 agent：`empire-eunuch`（primary, 默认）、`empire-cabinet`（all 模式）、3 个隐藏大学士（subagent）、6 个可见六部（subagent）
- 插件在 `server.config` 中将 `default_agent` 设为 `empire-eunuch`
- 所有 agent 默认权限 `{"*": "allow"}`，可在配置文件中按 agent 收紧
- `/廷议` 命令仅限 `empire-cabinet` agent 使用
- prompt 组装逻辑在 `src/prompts.ts`，使用中文，根据 `tone` 和 `requireDispatchApproval` 动态拼接

## 提示词修改流程

1. 编辑 `src/prompts/*.md`
2. 运行 `npm run generate`
3. 运行 `npm run verify`
