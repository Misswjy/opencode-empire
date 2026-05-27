# Agent Prompt 精修（三） Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 精修六部派工单、司礼监汇总复奏与内阁票拟分支，让派发、汇总和封驳判断更稳定。

**Architecture:** 保留现有 prompt 分层与模板布局，只在 `src/prompts.ts` 中补充模板字段和角色规则，必要时微调 `eunuch.md` 或 `cabinet.md` 文案。通过测试先锁定新增结构，再做最小实现并执行完整验证。

**Tech Stack:** TypeScript, Vitest, Node.js prompt generation

---

### Task 1: 为三类精修点写失败测试

**Files:**
- Modify: `src/__tests__/agents.test.ts`

- [ ] **Step 1: 给内阁派工单与票拟分支补断言**

```ts
expect(prompt).toContain("分部派发提示");
expect(prompt).toContain("是否建议准行");
expect(prompt).toContain("封驳理由");
expect(prompt).toContain("暂缓条件");
```

- [ ] **Step 2: 给司礼监汇总复奏补断言**

```ts
expect(prompt).toContain("汇总结论");
expect(prompt).toContain("各部回奏摘要");
expect(prompt).toContain("建议下一步");
```

- [ ] **Step 3: 运行目标测试并确认失败**

Run: `npm test -- src/__tests__/agents.test.ts`
Expected: FAIL，说明新模板字段尚未进入 prompt。

---

### Task 2: 实现三类模板增强

**Files:**
- Modify: `src/prompts.ts`
- Modify: `src/prompts/eunuch.md`（如需要）
- Modify: `src/prompts/cabinet.md`（如需要）

- [ ] **Step 1: 增强 `【六部派工单】`**

在 `CABINET_FORMS` 中加入：

```ts
"分部派发提示：",
```

并在 `cabinet` 文案或规则中强调六部不同派发重点。

- [ ] **Step 2: 增强 `【内阁票拟】` 分支字段**

在 `CABINET_FORMS` 中加入：

```ts
"是否建议准行：",
"封驳理由：",
"暂缓条件：",
```

- [ ] **Step 3: 增加司礼监汇总复奏模板**

新增 `EUNUCH_SUMMARY_FORM`，例如：

```ts
"【司礼监汇总复奏】",
"汇总结论：",
"各部回奏摘要：",
"已核实证据：",
"仍存分歧：",
"风险与请旨事项：",
"建议下一步：",
```

- [ ] **Step 4: 运行 `npm run generate`**

Run: `npm run generate`
Expected: `src/prompts/generated.ts` updated successfully.

---

### Task 3: 让测试转绿并做完整验证

**Files:**
- Modify: `src/__tests__/agents.test.ts`（如需微调断言措辞）

- [ ] **Step 1: 重新运行目标测试**

Run: `npm test -- src/__tests__/agents.test.ts`
Expected: PASS

- [ ] **Step 2: 运行完整校验**

Run: `npm run verify`
Expected: generate, typecheck, test, build 全部通过。
