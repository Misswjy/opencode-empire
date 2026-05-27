# 六部专业化复奏精修 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 精修户部、刑部、工部的复奏结构，让探索、审查和实现三类输出更专业。

**Architecture:** 保留统一 `【本部复奏】` 模板，只增强 `MINISTRY_RULES` 中三部的专属输出要求。通过测试先锁定新增结构，再做最小实现并运行完整验证。

**Tech Stack:** TypeScript, Vitest, Node.js prompt generation

---

### Task 1: 为三部专业化输出写失败测试

**Files:**
- Modify: `src/__tests__/agents.test.ts`

- [ ] **Step 1: 给户部补探索报告断言**

```ts
expect(agents["empire-ministry-revenue"]?.prompt).toContain("当前观察结论");
expect(agents["empire-ministry-revenue"]?.prompt).toContain("建议下一步调查");
```

- [ ] **Step 2: 给刑部补 review 分级断言**

```ts
expect(agents["empire-ministry-justice"]?.prompt).toContain("阻断问题");
expect(agents["empire-ministry-justice"]?.prompt).toContain("重要问题");
expect(agents["empire-ministry-justice"]?.prompt).toContain("一般问题");
expect(agents["empire-ministry-justice"]?.prompt).toContain("建议处理顺序");
```

- [ ] **Step 3: 给工部补实现交付断言**

```ts
expect(agents["empire-ministry-works"]?.prompt).toContain("变更摘要");
expect(agents["empire-ministry-works"]?.prompt).toContain("未覆盖场景");
```

- [ ] **Step 4: 运行目标测试并确认失败**

Run: `npm test -- src/__tests__/agents.test.ts`
Expected: FAIL，说明三部新字段尚未进入 prompt。

---

### Task 2: 实现三部规则增强

**Files:**
- Modify: `src/prompts.ts`

- [ ] **Step 1: 强化户部规则**

在 `MINISTRY_RULES` 中追加探索报告字段，例如：

```ts
"当前观察结论"
"建议下一步调查"
```

- [ ] **Step 2: 强化刑部规则**

在 `MINISTRY_RULES` 中追加 review 分级字段，例如：

```ts
"阻断问题"
"重要问题"
"一般问题"
"建议处理顺序"
```

- [ ] **Step 3: 强化工部规则**

在 `MINISTRY_RULES` 中追加交付说明字段，例如：

```ts
"变更摘要"
"未覆盖场景"
```

- [ ] **Step 4: 运行 `npm run generate`**

Run: `npm run generate`
Expected: `src/prompts/generated.ts` updated successfully.

---

### Task 3: 让测试转绿并做完整验证

**Files:**
- Modify: `src/__tests__/agents.test.ts`（如需微调文案）

- [ ] **Step 1: 重新运行目标测试**

Run: `npm test -- src/__tests__/agents.test.ts`
Expected: PASS

- [ ] **Step 2: 运行完整校验**

Run: `npm run verify`
Expected: generate, typecheck, test, build 全部通过。
