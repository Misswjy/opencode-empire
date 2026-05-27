# Prompt 字段去冲突整理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 去掉 prompt 模板中的残留冲突，让内阁决策分支更清楚、风险字段不重复、主子流程共享同一套底层规则。

**Architecture:** 保持现有模板布局，只通过 `src/prompts.ts` 的字段调整与 `cabinet.md` 的规则补充完成收口。测试先行约束互斥规则、字段改名与共享规则同步，再做最小实现并执行完整验证。

**Tech Stack:** TypeScript, Vitest, Node.js prompt generation

---

### Task 1: 为去冲突整理写失败测试

**Files:**
- Modify: `src/__tests__/agents.test.ts`

- [ ] **Step 1: 给 cabinet 决策分支互斥规则补断言**

```ts
expect(prompt).toContain("四类主结论");
expect(prompt).toContain("不得同时成立");
```

- [ ] **Step 2: 给风险字段改名与共享规则统一补断言**

```ts
expect(prompt).toContain("主要风险");
expect(prompt).not.toContain("风险与封驳点");
expect(agents["empire-ministry-revenue"]?.prompt).toContain("工程事实优先于角色化表达");
```

- [ ] **Step 3: 运行目标测试并确认失败**

Run: `npm test -- src/__tests__/agents.test.ts`
Expected: FAIL，说明新规则和新字段尚未进入 prompt。

---

### Task 2: 实现去冲突整理

**Files:**
- Modify: `src/prompts.ts`
- Modify: `src/prompts/cabinet.md`

- [ ] **Step 1: 为主流程和子流程抽共享规则块**
- [ ] **Step 2: 将 `风险与封驳点` 改为 `主要风险`**
- [ ] **Step 3: 在 `cabinet.md` 增加决策分支互斥规则**
- [ ] **Step 4: 运行 `npm run generate`**

Run: `npm run generate`
Expected: `src/prompts/generated.ts` updated successfully.

---

### Task 3: 让测试转绿并做完整验证

**Files:**
- Modify: `src/__tests__/agents.test.ts`（如需微调措辞）

- [ ] **Step 1: 重新运行目标测试**

Run: `npm test -- src/__tests__/agents.test.ts`
Expected: PASS

- [ ] **Step 2: 运行完整校验**

Run: `npm run verify`
Expected: generate, typecheck, test, build 全部通过。
