# Agent Prompt 深度改造 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 统一 empire agents 的批红与执行边界，强化各角色分工，并让 `内阁`、`大学士`、`六部` 的输出契约更稳定。

**Architecture:** 保留现有 markdown prompt 文件与 `buildPrompt()` 入口，在 `src/prompts.ts` 引入共享宪章、角色专属规则与模式化模板。通过测试先约束新行为，再最小化修改 prompt 文案和拼装逻辑。

**Tech Stack:** TypeScript, Vitest, Node.js prompt generation

---

### Task 1: 用测试锁定新 prompt 契约

**Files:**
- Modify: `src/__tests__/agents.test.ts`

- [ ] **Step 1: 添加司礼监、内阁、大学士、六部的新行为断言**

```ts
it("keeps eunuch in the low-risk dispatch lane and removes the old no-approval rule", () => {
  const agents = buildEmpireAgents({});
  const prompt = agents["empire-eunuch"]?.prompt ?? "";

  expect(prompt).toContain("低风险探索");
  expect(prompt).toContain("实际代码修改");
  expect(prompt).not.toContain("发部无需批红");
});

it("teaches cabinet different output contracts for primary and subagent modes", () => {
  const prompt = buildEmpireAgents({})["empire-cabinet"]?.prompt ?? "";

  expect(prompt).toContain("主代理回奏模板");
  expect(prompt).toContain("子代理回呈模板");
  expect(prompt).toContain("【六部派工单】");
});

it("gives grand secretaries different review lenses", () => {
  const agents = buildEmpireAgents({});

  expect(agents["empire-grand-secretary-a"]?.prompt).toContain("长期维护");
  expect(agents["empire-grand-secretary-b"]?.prompt).toContain("交付成本");
  expect(agents["empire-grand-secretary-c"]?.prompt).toContain("失败路径");
});

it("gives each ministry role-specific guardrails", () => {
  const agents = buildEmpireAgents({});

  expect(agents["empire-ministry-revenue"]?.prompt).toContain("不做实现");
  expect(agents["empire-ministry-war"]?.prompt).toContain("并发策略");
  expect(agents["empire-ministry-justice"]?.prompt).toContain("结论先于摘要");
  expect(agents["empire-ministry-works"]?.prompt).toContain("唯一默认落地实施部门");
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm test -- src/__tests__/agents.test.ts`
Expected: FAIL，旧 prompt 不包含新的结构化约束。

---

### Task 2: 重写 prompt 文案与拼装逻辑

**Files:**
- Modify: `src/prompts/eunuch.md`
- Modify: `src/prompts/cabinet.md`
- Modify: `src/prompts/grand-secretary.md`
- Modify: `src/prompts/ministry.md`
- Modify: `src/prompts.ts`

- [ ] **Step 1: 重写 markdown prompt 源文案**

将四份 markdown 改为强调：

- `eunuch.md`：默认入口、低风险直办、复杂事项转内阁、不得擅自拍板复杂方案
- `cabinet.md`：复杂事项统筹、主/子代理职责差异、不直接改代码
- `grand-secretary.md`：独立审议、不可串联、必须给独特关注点
- `ministry.md`：只按职责承办、越界时说明移交对象、实现统一交工部

- [ ] **Step 2: 在 `src/prompts.ts` 增加共享宪章与模板分支**

实现内容包括：

- 统一的批红与风险边界说明
- `CABINET_PRIMARY_FORMS` 与 `CABINET_SUBAGENT_FORM`
- `EUNUCH_DECREE_FORM` 与 `MINISTRY_FORM`
- `GRAND_SECRETARY_LENSES` 映射
- `MINISTRY_RULES` 映射
- `buildPrompt()` 中针对 `empire-cabinet`、`empire-grand-secretary-*`、六部的专属拼装逻辑

- [ ] **Step 3: 运行 `npm run generate` 更新生成产物**

Run: `npm run generate`
Expected: `src/prompts/generated.ts` regenerated successfully.

---

### Task 3: 让测试转绿并做完整验证

**Files:**
- Modify: `src/__tests__/agents.test.ts`（如有必要微调断言文案）

- [ ] **Step 1: 重新运行目标测试**

Run: `npm test -- src/__tests__/agents.test.ts`
Expected: PASS

- [ ] **Step 2: 运行完整校验**

Run: `npm run verify`
Expected: generate, typecheck, test, build 全部通过。
