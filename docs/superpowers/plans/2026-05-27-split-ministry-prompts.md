# 六部独立提示词拆分 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将六部从共享 prompt 与统一复奏模板，拆成六个独立提示词文件和六套独立模板。

**Architecture:** 新增六个 ministry markdown 文件，更新 prompt 生成脚本产出六个常量，并在 `src/prompts.ts` 中为六部分别组装 prompt 和模板。测试先锁定六部内容不再共享，再做最小实现并执行完整验证。

**Tech Stack:** TypeScript, Vitest, Node.js prompt generation

---

### Task 1: 为六部独立化写失败测试

**Files:**
- Modify: `src/__tests__/agents.test.ts`

- [ ] **Step 1: 断言六部具备各自独立模板特征**

```ts
expect(agents["empire-ministry-personnel"]?.prompt).toContain("【吏部拆解单】");
expect(agents["empire-ministry-revenue"]?.prompt).toContain("【户部探索复奏】");
expect(agents["empire-ministry-rites"]?.prompt).toContain("【礼部审校复奏】");
expect(agents["empire-ministry-war"]?.prompt).toContain("【兵部编排复奏】");
expect(agents["empire-ministry-justice"]?.prompt).toContain("【刑部审覆】");
expect(agents["empire-ministry-works"]?.prompt).toContain("【工部交付复奏】");
```

- [ ] **Step 2: 运行目标测试并确认失败**

Run: `npm test -- src/__tests__/agents.test.ts`
Expected: FAIL，说明六部仍共享旧模板。

---

### Task 2: 实现六部独立 prompt 文件与生成脚本

**Files:**
- Create: `src/prompts/ministry-personnel.md`
- Create: `src/prompts/ministry-revenue.md`
- Create: `src/prompts/ministry-rites.md`
- Create: `src/prompts/ministry-war.md`
- Create: `src/prompts/ministry-justice.md`
- Create: `src/prompts/ministry-works.md`
- Modify: `scripts/generate-prompts.ts`

- [ ] **Step 1: 创建六个独立 ministry prompt 文件**
- [ ] **Step 2: 更新生成脚本输出六个 ministry 常量**

---

### Task 3: 更新 prompt 组装逻辑

**Files:**
- Modify: `src/prompts.ts`

- [ ] **Step 1: 删除对共享 `MINISTRY_PROMPT` / `MINISTRY_FORM` 的依赖**
- [ ] **Step 2: 为六部分别定义独立模板常量**
- [ ] **Step 3: 在 `buildPrompt()` 中为六部单独分支**
- [ ] **Step 4: 运行 `npm run generate`**

Run: `npm run generate`
Expected: `src/prompts/generated.ts` updated successfully.

---

### Task 4: 让测试转绿并做完整验证

**Files:**
- Modify: `src/__tests__/agents.test.ts`（如需微调）

- [ ] **Step 1: 重新运行目标测试**

Run: `npm test -- src/__tests__/agents.test.ts`
Expected: PASS

- [ ] **Step 2: 运行完整校验**

Run: `npm run verify`
Expected: generate, typecheck, test, build 全部通过。
