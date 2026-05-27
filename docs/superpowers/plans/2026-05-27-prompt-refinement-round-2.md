# Agent Prompt 精修（二） Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 精修六部复奏、内阁复奏与大学士廷议输出，让角色产物更稳定、更专业。

**Architecture:** 保留现有 prompt 文件与 `buildPrompt()` 结构，通过 `src/prompts.ts` 中的模板字段与专属规则增强来提升输出质量。测试先行锁定三类新增结构，再做最小实现并运行完整验证。

**Tech Stack:** TypeScript, Vitest, Node.js prompt generation

---

### Task 1: 为三类精修点补失败测试

**Files:**
- Modify: `src/__tests__/agents.test.ts`

- [ ] **Step 1: 给司礼监、内阁、刑部补结构断言**

```ts
expect(prompt).toContain("完成定义");
expect(prompt).toContain("决策摘要");
expect(prompt).toContain("分部策略");
expect(agents["empire-ministry-justice"]?.prompt).toContain("问题严重性");
expect(agents["empire-ministry-justice"]?.prompt).toContain("是否准行");
```

- [ ] **Step 2: 给六部与大学士补差异化断言**

```ts
expect(agents["empire-ministry-revenue"]?.prompt).toContain("调用链");
expect(agents["empire-ministry-works"]?.prompt).toContain("改动文件");
expect(agents["empire-grand-secretary-a"]?.prompt).toContain("你的判断");
expect(agents["empire-grand-secretary-c"]?.prompt).toContain("与常规看法不同之处");
```

- [ ] **Step 3: 运行目标测试并确认失败**

Run: `npm test -- src/__tests__/agents.test.ts`
Expected: FAIL，说明新字段尚未写入 prompt。

---

### Task 2: 实现三类 prompt 精修

**Files:**
- Modify: `src/prompts.ts`
- Modify: `src/prompts/grand-secretary.md`（如需要）
- Modify: `src/prompts/ministry.md`（如需要）

- [ ] **Step 1: 强化 `MINISTRY_RULES`**

为六部补入复奏必须附带的信息，例如：

```ts
"empire-ministry-revenue": "本部负责仓库舆图、文件定位、依赖关系、调用链梳理与低风险分析，不做实现。复奏应附相关文件、依赖关系、调用链结论与未确认点。"
```

- [ ] **Step 2: 强化 `CABINET_FORMS` 的 `【内阁复奏】` 区块**

将末尾字段改为：

```ts
"【内阁复奏】",
"当前结论：",
"已办事项：",
"关键证据：",
"阻塞与未决：",
"风险与影响面：",
"下一步建议：",
"请陛下裁定：",
```

- [ ] **Step 3: 强化大学士共同骨架与差异化输出要求**

在大学士 prompt 或镜像规则中加入：

```ts
"你的判断：",
"建议方案：",
"主要风险：",
"需圣裁事项：",
"与常规看法不同之处：",
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
