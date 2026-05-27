# Agent Prompt 文档化 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将每个 agent 的提示词正文拆分到独立 .md 文件，构建时通过脚本内联为 TypeScript 常量。

**Architecture:** 4 个 .md 文件存放纯 prompt 正文。`scripts/generate-prompts.ts` 读取 .md 生成 `src/prompts/generated.ts`（导出 4 个字符串常量）。`src/prompts.ts` import 常量 + 动态拼接。构建流程新增 `generate` 步骤。

**Tech Stack:** TypeScript, Node.js, Vitest

---

### Task 1: 创建 4 个 .md 提示词文件

**Files:**
- Create: `src/prompts/eunuch.md`
- Create: `src/prompts/cabinet.md`
- Create: `src/prompts/grand-secretary.md`
- Create: `src/prompts/ministry.md`

- [ ] **Step 1: 创建 `src/prompts/eunuch.md`**

```markdown
你是司礼监主 agent，是用户的日常主对话入口。

简单问答、信息查询、格式整理、轻量建议可直接回答。

需要代码探索、代码实现、代码审查、方案设计时，以【传旨】形式直接向对应六部派单办理。

对于复杂票拟需求，以【传旨】形式发内阁票拟。内阁回报票拟后，呈皇帝批红。批红后再传旨六部执行。

对于需要多方独立审议（廷议）的复杂需求，建议用户切换至内阁（empire-cabinet），由内阁主代理召大学士廷议。

发部无需批红。涉及破坏性命令、外部网络、密钥、生产数据时必须请旨。

六部办毕后以【本部复奏】回报，司礼监汇总呈报。
```

- [ ] **Step 2: 创建 `src/prompts/cabinet.md`**

```markdown
你是内阁 agent，mode 为 all——既可作主代理也可作子代理。

作为主代理时：负责复杂需求的票拟、廷议、发部、复奏全流程。需要多方审议时可通过 /廷议 召大学士独立审议。

作为子代理（被司礼监传旨调用）时：直接产出票拟，不可召大学士，不可直接向六部派工。回报司礼监即可。

你不直接修改代码。代码探索交户部，代码实现交工部，代码审查交刑部。
```

- [ ] **Step 3: 创建 `src/prompts/grand-secretary.md`**

```markdown
你是{{title}}。你的职责是独立审议同一需求，不和其他大学士串联。

输出必须包含：你的理解、建议方案、主要风险、需要皇帝圣裁的问题。

你不直接派工，不直接修改代码。
```

- [ ] **Step 4: 创建 `src/prompts/ministry.md`**

```markdown
你是{{title}}，职责：{{description}}

只在职责范围内办理。若任务越界，复奏说明应交哪个部门。

涉及破坏性命令、外部网络、密钥、生产数据时必须请旨。
```

---

### Task 2: 创建生成脚本并更新构建配置

**Files:**
- Create: `scripts/generate-prompts.ts`
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: 创建 `scripts/generate-prompts.ts`**

```typescript
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PROMPTS_DIR = join(import.meta.dirname, "..", "src", "prompts");
const OUTPUT = join(PROMPTS_DIR, "generated.ts");

function readPrompt(name: string): string {
  return readFileSync(join(PROMPTS_DIR, `${name}.md`), "utf-8").trim();
}

const TEMPLATE = `// 本文件由 scripts/generate-prompts.ts 自动生成，请勿手动编辑。
export const EUNUCH_PROMPT = ${JSON.stringify(readPrompt("eunuch"))};
export const CABINET_PROMPT = ${JSON.stringify(readPrompt("cabinet"))};
export const GRAND_SECRETARY_PROMPT = ${JSON.stringify(readPrompt("grand-secretary"))};
export const MINISTRY_PROMPT = ${JSON.stringify(readPrompt("ministry"))};
`;

writeFileSync(OUTPUT, TEMPLATE, "utf-8");
console.log("Generated src/prompts/generated.ts");
```

- [ ] **Step 2: 更新 `package.json` scripts**

将 `build` 和 `verify` 更新为：

```json
"scripts": {
  "clean": "node -e \"fs.rmSync('dist', { recursive: true, force: true })\"",
  "generate": "node scripts/generate-prompts.ts",
  "build": "npm run clean && npm run generate && tsc -p tsconfig.build.json",
  "typecheck": "tsc -p tsconfig.json --noEmit",
  "test": "vitest run",
  "verify": "npm run generate && npm run typecheck && npm run test && npm run build"
},
```

- [ ] **Step 3: 更新 `.gitignore`**

追加一行：

```
src/prompts/generated.ts
```

---

### Task 3: 重构 `src/prompts.ts`

**Files:**
- Modify: `src/prompts.ts`

- [ ] **Step 1: 替换 `src/prompts.ts` 为 import 常量 + 动态拼接版本**

```typescript
import type { EmpireRole, ToneLevel } from "./types.js";
import { EUNUCH_PROMPT, CABINET_PROMPT, GRAND_SECRETARY_PROMPT, MINISTRY_PROMPT } from "./prompts/generated.js";

const LANGUAGE_REQUIREMENT = "你必须使用中文。";

function buildWorkflow(requireDispatchApproval: boolean): string {
  return [
    LANGUAGE_REQUIREMENT,
    requireDispatchApproval
      ? "你运行在 opencode-empire 插件中。用户是皇帝，重要执行前必须等待批红。"
      : "你运行在 opencode-empire 插件中。用户是皇帝，已批红票拟范围内，可以直接发部办理。",
    "标准流程：听旨 -> 追问 -> 廷议 -> 票拟 -> 待批红 -> 拟派工 -> 待发部 -> 办理中 -> 复奏。",
    "角色语气为中度角色化：开头和请示可以像奏疏，文件、命令、风险、测试、验收标准必须现代清楚。",
  ].join("\n");
}

const CABINET_FORMS = [
  "【内阁票拟】",
  "臣等共识：",
  "尚需圣裁：",
  "拟行方案：",
  "不办事项：",
  "风险与封驳点：",
  "验收标准：",
  "建议派工：",
  "",
  "【六部派工单】",
  "批红依据：",
  "本轮目标：",
  "各部职责：",
  "执行顺序：",
  "需调用模型：",
  "验收凭据：",
  "回滚方案：",
  "请陛下批红：",
  "",
  "【内阁复奏】",
  "已办：",
  "证据：",
  "未决：",
  "风险：",
  "请陛下裁定：",
].join("\n");

const MINISTRY_FORM = [
  "【本部复奏】",
  "臣等所办：",
  "证据：",
  "所遇风险：",
  "请陛下裁定：",
].join("\n");

const EUNUCH_DECREE = [
  "【传旨】",
  "着令：",
  "差事：",
  "办毕复奏。",
].join("\n");

export function buildPrompt(role: EmpireRole, tone: ToneLevel, requireDispatchApproval = true): string {
  const toneRule = ({
    light: "轻度角色化：只在称谓和标题体现官署感。",
    medium: "中度角色化：汇报像奏疏，但工程事实必须直给。",
    high: "高度角色化：可以更沉浸，但不得遮蔽工程事实。",
  } satisfies Record<ToneLevel, string>)[tone];
  const workflow = buildWorkflow(requireDispatchApproval);
  const dispatchBoundary = requireDispatchApproval
    ? "没有用户批红，不得发部办理。"
    : "已批红票拟范围内，可以直接发部办理；超出批红范围仍须请旨。";

  if (role.id === "empire-cabinet") {
    return [
      workflow,
      toneRule,
      CABINET_PROMPT,
      "主代理模式下，" + dispatchBoundary,
      CABINET_FORMS,
    ].join("\n\n");
  }

  if (role.id === "empire-eunuch") {
    return [
      LANGUAGE_REQUIREMENT,
      toneRule,
      EUNUCH_PROMPT,
      EUNUCH_DECREE,
      MINISTRY_FORM,
    ].join("\n\n");
  }

  if (role.id.startsWith("empire-grand-secretary")) {
    return [
      workflow,
      toneRule,
      GRAND_SECRETARY_PROMPT.replace("{{title}}", role.title),
    ].join("\n\n");
  }

  return [
    workflow,
    toneRule,
    MINISTRY_PROMPT.replace("{{title}}", role.title).replace("{{description}}", role.description),
    MINISTRY_FORM,
  ].join("\n\n");
}
```

- [ ] **Step 2: 运行 generate 然后运行全部测试**

```bash
cd /Users/xingzhan/Documents/opencode-empire && npm run generate && npm run test
```

Expected: 所有 26 测试通过（提示词输出不变）。

---

### Task 4: 完整验证

- [ ] **Step 1: 运行 `npm run verify`**

```bash
cd /Users/xingzhan/Documents/opencode-empire && npm run verify
```

Expected: generate → typecheck → test (26/26) → build 全部通过。

---

### Self-Review

**1. Spec coverage:**
- .md 文件创建 → Task 1 ✓
- generate 脚本 → Task 2 ✓
- prompts.ts 重构 → Task 3 ✓
- 构建配置 → Task 2 ✓
- .gitignore → Task 2 ✓
- 验证 → Task 4 ✓

**2. Placeholder scan:** 无 TBD/TODO/占位符。

**3. Type consistency:** generated.ts 导出的常量名（EUNUCH_PROMPT 等）与 prompts.ts import 一致。{{title}}/{{description}} 占位符在 prompts.ts 中被替换。
