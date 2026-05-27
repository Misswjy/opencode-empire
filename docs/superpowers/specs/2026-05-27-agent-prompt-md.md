# Agent Prompt 文档化

> 2026-05-27 — 将每个 agent 的提示词正文拆分到独立 .md 文件，构建时内联为 TypeScript 常量。

## 背景

当前 `src/prompts.ts` 一个文件承载了 4 类 agent（司礼监、内阁、大学士、六部）的全部提示词正文，混杂了大量模板字符串与动态拼接逻辑。每个 agent 的 prompt 正文独立为 .md 文档，遵循 OpenCode 官方推荐格式，提高可维护性。

## 设计

### 文件结构

```
src/
  prompts.ts                       # 纯组装逻辑：import 常量 + 动态拼接
  prompts/
    eunuch.md                      # 司礼监 prompt 正文
    cabinet.md                     # 内阁 prompt 正文
    grand-secretary.md             # 大学士 prompt 正文
    ministry.md                    # 六部 prompt 正文
    generated.ts                   # 构建脚本生成，不提交 git
scripts/
  generate-prompts.ts              # 读取 .md → 写入 generated.ts
```

### generated.ts 格式

构建脚本读取 4 个 .md 文件，生成如下导出：

```typescript
// 本文件由 scripts/generate-prompts.ts 自动生成，请勿手动编辑。
export const EUNUCH_PROMPT = `...`;
export const CABINET_PROMPT = `...`;
export const GRAND_SECRETARY_PROMPT = `...`;
export const MINISTRY_PROMPT = `...`;
```

### prompts.ts 变化

- 删除内联模板字符串（CABINET_FORMS、MINISTRY_FORM、EUNUCH_DECREE 保留，它们不是 agent prompt 正文）
- `import` 4 个常量
- `buildPrompt()` 用常量 + toneRule、dispatchBoundary 等少量动态字符串拼接

### 构建流程

```
npm run build
  → npm run clean
  → node scripts/generate-prompts.ts    # 新增：.md → generated.ts
  → tsc -p tsconfig.build.json         # generated.ts 编译进 dist/
```

### 改动文件

- 新增：`src/prompts/eunuch.md`
- 新增：`src/prompts/cabinet.md`
- 新增：`src/prompts/grand-secretary.md`
- 新增：`src/prompts/ministry.md`
- 新增：`scripts/generate-prompts.ts`
- 修改：`src/prompts.ts` — 删除内联正文，改为 import 常量
- 修改：`package.json` — build 脚本增加 generate 步骤
- 修改：`.gitignore` — 忽略 `src/prompts/generated.ts`
- 修改：`src/__tests__/agents.test.ts` — 更新 prompt 断言（提示词正文移至 .md，断言应检查常量内容）
