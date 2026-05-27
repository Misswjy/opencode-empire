# 六部独立提示词拆分设计

> 2026-05-27 — 将六部从共享 `ministry.md` 与统一复奏模板的结构，拆分为六个独立提示词文件和六套独立复奏模板。

## 背景

当前六部虽然已经拥有不同的规则层要求，但运行时仍共享一份 `ministry.md` 正文与统一的 `【本部复奏】` 骨架。结果是：

1. 六部的角色正文仍不够独立。
2. 各部回复模板只是靠规则补充，不是真正的部门专属模板。
3. 后续继续精修某一部时，仍要在共享逻辑里做条件分支，维护成本较高。

用户明确要求六部提示词独立，因此本轮将六部完全拆开。

## 目标

1. 六部各自拥有独立 prompt 文件。
2. 六部各自拥有独立复奏模板。
3. `buildPrompt()` 不再让六部走同一通用 ministry 分支。

## 方案

### 文件拆分

新增：

- `src/prompts/ministry-personnel.md`
- `src/prompts/ministry-revenue.md`
- `src/prompts/ministry-rites.md`
- `src/prompts/ministry-war.md`
- `src/prompts/ministry-justice.md`
- `src/prompts/ministry-works.md`

每个文件直接写本部门的：

- 职责边界
- 不负责事项
- 办理风格
- 复奏重点

### 生成产物

`generated.ts` 从原先单一 `MINISTRY_PROMPT` 扩展为六个部门常量。

### Prompt 组装

`buildPrompt()` 为六部单独分支：

- 人员部 prompt + 人员部模板
- 户部 prompt + 户部模板
- 礼部 prompt + 礼部模板
- 兵部 prompt + 兵部模板
- 刑部 prompt + 刑部模板
- 工部 prompt + 工部模板

### 复奏模板

六部各自拥有不同的 `FORM` 常量，而不再共享一个 `MINISTRY_FORM`。

## 影响文件

- 新增：`src/prompts/ministry-*.md`（6 个）
- 修改：`scripts/generate-prompts.ts`
- 修改：`src/prompts.ts`
- 修改：`src/__tests__/agents.test.ts`

## 验证

1. `npm run generate`
2. `npm test -- src/__tests__/agents.test.ts`
3. `npm run verify`
