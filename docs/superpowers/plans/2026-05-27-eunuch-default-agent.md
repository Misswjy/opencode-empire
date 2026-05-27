# 司礼监为日常主代理 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将司礼监（empire-eunuch）设为 OpenCode 默认 agent，内阁（empire-cabinet）mode 改为 "all"，支持司礼监传旨内阁票拟。

**Architecture:** 双 primary agent 分工。司礼监为默认入口处理日常任务并以传旨形式向六部/内阁派单；内阁为复杂需求入口支持票拟与廷议，同时作为 subagent 被司礼监传旨调用。

**Tech Stack:** TypeScript, Vitest, @opencode-ai/plugin

---

### Task 1: 更新 agents.test.ts — RED

**Files:**
- Modify: `src/__tests__/agents.test.ts`

- [ ] **Step 1: 新增 eunuch prompt 与 default_agent 断言**

修改 `src/__tests__/agents.test.ts`，在现有测试中插入新断言，新增独立测试：

```typescript
import { describe, expect, it } from "vitest";
import { buildEmpireAgents } from "../agents.js";

describe("buildEmpireAgents", () => {
  it("registers cabinet as mode all, eunuch as primary, hidden grand secretaries, and visible ministries", () => {
    const agents = buildEmpireAgents({});

    expect(agents["empire-cabinet"]?.mode).toBe("all");
    expect(agents["empire-eunuch"]?.mode).toBe("primary");
    expect(agents["empire-grand-secretary-a"]?.hidden).toBe(true);
    expect(agents["empire-grand-secretary-b"]?.hidden).toBe(true);
    expect(agents["empire-grand-secretary-c"]?.hidden).toBe(true);
    expect(agents["empire-ministry-personnel"]?.hidden).toBe(false);
    expect(agents["empire-ministry-works"]?.hidden).toBe(false);
  });

  it("assigns read-only permissions to exploration and review roles", () => {
    const agents = buildEmpireAgents({});

    expect(agents["empire-ministry-revenue"]?.permission).toEqual({
      edit: "deny",
      bash: "ask",
      webfetch: "ask",
      external_directory: "ask",
    });
    expect(agents["empire-ministry-justice"]?.permission?.edit).toBe("deny");
  });

  it("allows the works ministry to edit with approval", () => {
    const agents = buildEmpireAgents({});

    expect(agents["empire-ministry-works"]?.permission?.edit).toBe("ask");
  });

  it("uses model overrides and disabled roles", () => {
    const agents = buildEmpireAgents({
      models: {
        "empire-cabinet": "cockpit/gpt-5.4",
        "empire-ministry-works": "cockpit/gpt-5.5",
      },
      disabledRoles: ["empire-ministry-war"],
    });

    expect(agents["empire-cabinet"]?.model).toBe("cockpit/gpt-5.4");
    expect(agents["empire-ministry-works"]?.model).toBe("cockpit/gpt-5.5");
    expect(agents["empire-ministry-war"]).toBeUndefined();
  });

  it("includes eunuch decree format and daily primary role", () => {
    const agents = buildEmpireAgents({});
    const prompt = agents["empire-eunuch"]?.prompt ?? "";

    expect(prompt).toContain("日常主对话入口");
    expect(prompt).toContain("【传旨】");
    expect(prompt).toContain("着令：");
    expect(prompt).toContain("办毕复奏。");
    expect(prompt).toContain("发部无需批红");
  });

  it("describes cabinet as dual-role agent with mode:all capabilities", () => {
    const agents = buildEmpireAgents({});
    const prompt = agents["empire-cabinet"]?.prompt ?? "";

    expect(prompt).toContain("内阁票拟");
    expect(prompt).toContain("作为子代理");
    expect(prompt).toContain("作为主代理");
  });

  it("includes required cabinet forms and approval boundary", () => {
    const agents = buildEmpireAgents({});
    const prompt = agents["empire-cabinet"]?.prompt ?? "";

    expect(prompt).toContain("【内阁票拟】");
    expect(prompt).toContain("【六部派工单】");
    expect(prompt).toContain("【内阁复奏】");
    expect(prompt).toContain("没有用户批红，不得发部办理");
  });

  it("honors disabled dispatch approval in the cabinet prompt", () => {
    const agents = buildEmpireAgents({ requireDispatchApproval: false });
    const prompt = agents["empire-cabinet"]?.prompt ?? "";

    expect(prompt).toContain("已批红票拟范围内，可以直接发部办理");
    expect(prompt).not.toContain("没有用户批红，不得发部办理");
  });

  it("keeps ministry prompts within department responsibility", () => {
    const agents = buildEmpireAgents({});

    expect(agents["empire-ministry-revenue"]?.prompt).toContain("代码探索");
    expect(agents["empire-ministry-works"]?.prompt).toContain("代码实现");
    expect(agents["empire-ministry-justice"]?.prompt).toContain("代码审查");
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm run test -- src/__tests__/agents.test.ts
```

Expected: FAIL — 因为 `empire-cabinet` mode 仍是 `"primary"`，且 eunuch prompt 不含 `"日常主对话入口"`、`"【传旨】"`，cabinet prompt 不含 `"作为子代理"`。

---

### Task 2: 更新 defaults.ts 与 prompts.ts — GREEN

**Files:**
- Modify: `src/defaults.ts`
- Modify: `src/prompts.ts`

- [ ] **Step 1: 更新 defaults.ts — cabinet mode 改 "all"，司礼监描述更新**

```typescript
import type { EmpireRole } from "./types.js";

export const DEFAULT_TONE = "medium" as const;

export const DEFAULT_REQUIRE_DISPATCH_APPROVAL = true;

export const DEFAULT_MODELS = {
  cabinet: "cockpit/gpt-5.4",
  strong: "cockpit/gpt-5.5",
  standard: "cockpit/gpt-5.4",
  fast: "opencode-go/deepseek-v4-flash",
} as const;

export const EMPIRE_ROLES: EmpireRole[] = [
  { id: "empire-cabinet", title: "内阁", office: "内阁", description: "主 agent / 子 agent。负责票拟、廷议、发部和复奏。可被司礼监传旨调用直出票拟。", mode: "all", canEdit: false, defaultModel: DEFAULT_MODELS.cabinet },
  { id: "empire-eunuch", title: "司礼监", office: "司礼监", description: "日常主 agent。负责日常问答与简单任务，以传旨形式向六部及内阁派单；需廷议时建议切换至内阁。", mode: "primary", canEdit: false, defaultModel: DEFAULT_MODELS.standard },
  { id: "empire-grand-secretary-a", title: "内阁大学士甲", office: "内阁", description: "隐藏 subagent。独立审议需求，输出共识、分歧、风险和待裁决事项。", mode: "subagent", hidden: true, canEdit: false, defaultModel: DEFAULT_MODELS.strong },
  { id: "empire-grand-secretary-b", title: "内阁大学士乙", office: "内阁", description: "隐藏 subagent。独立审议需求，输出共识、分歧、风险和待裁决事项。", mode: "subagent", hidden: true, canEdit: false, defaultModel: DEFAULT_MODELS.standard },
  { id: "empire-grand-secretary-c", title: "内阁大学士丙", office: "内阁", description: "隐藏 subagent。独立审议需求，输出共识、分歧、风险和待裁决事项。", mode: "subagent", hidden: true, canEdit: false, defaultModel: DEFAULT_MODELS.fast },
  { id: "empire-ministry-personnel", title: "吏部", office: "吏部", description: "可见 subagent。负责把已批红票拟转成执行方案。", mode: "subagent", hidden: false, canEdit: false, defaultModel: DEFAULT_MODELS.standard },
  { id: "empire-ministry-revenue", title: "户部", office: "户部", description: "可见 subagent。负责代码探索、仓库舆图、相关文件和依赖定位。", mode: "subagent", hidden: false, canEdit: false, defaultModel: DEFAULT_MODELS.fast },
  { id: "empire-ministry-rites", title: "礼部", office: "礼部", description: "可见 subagent。负责方案审核、交互文案、角色口吻和文档表达。", mode: "subagent", hidden: false, canEdit: false, defaultModel: DEFAULT_MODELS.standard },
  { id: "empire-ministry-war", title: "兵部", office: "兵部", description: "可见 subagent。负责执行流程、自动化、并发派发和失败重试建议。", mode: "subagent", hidden: false, canEdit: false, defaultModel: DEFAULT_MODELS.standard },
  { id: "empire-ministry-justice", title: "刑部", office: "刑部", description: "可见 subagent。负责代码审查、测试把关、权限和风险审查。", mode: "subagent", hidden: false, canEdit: false, defaultModel: DEFAULT_MODELS.strong },
  { id: "empire-ministry-works", title: "工部", office: "工部", description: "可见 subagent。负责代码实现、构建配置、类型修复和集成落地。", mode: "subagent", hidden: false, canEdit: true, defaultModel: DEFAULT_MODELS.strong },
];
```

- [ ] **Step 2: 更新 prompts.ts — 新增传旨模板，重写司礼监/内阁 prompt**

```typescript
import type { EmpireRole, ToneLevel } from "./types.js";

function buildWorkflow(requireDispatchApproval: boolean): string {
  return [
    "你必须使用中文。",
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
  const toneRule = {
    light: "轻度角色化：只在称谓和标题体现官署感。",
    medium: "中度角色化：汇报像奏疏，但工程事实必须直给。",
    high: "高度角色化：可以更沉浸，但不得遮蔽工程事实。",
  }[tone];
  const workflow = buildWorkflow(requireDispatchApproval);
  const dispatchBoundary = requireDispatchApproval
    ? "没有用户批红，不得发部办理。"
    : "已批红票拟范围内，可以直接发部办理；超出批红范围仍须请旨。";

  if (role.id === "empire-cabinet") {
    return [
      workflow,
      toneRule,
      "你是内阁 agent，mode 为 all——既可作主代理也可作子代理。",
      "作为主代理时：负责复杂需求的票拟、廷议、发部、复奏全流程。需要多方审议时可通过 /廷议 召大学士独立审议。",
      "作为子代理（被司礼监传旨调用）时：直接产出票拟，不可召大学士，不可直接向六部派工。回报司礼监即可。",
      "你不直接修改代码。代码探索交户部，代码实现交工部，代码审查交刑部。",
      "主代理模式下，" + dispatchBoundary,
      CABINET_FORMS,
    ].join("\n\n");
  }

  if (role.id === "empire-eunuch") {
    return [
      "你必须使用中文。",
      toneRule,
      "你是司礼监主 agent，是用户的日常主对话入口。",
      "简单问答、信息查询、格式整理、轻量建议可直接回答。",
      "需要代码探索、代码实现、代码审查、方案设计时，以【传旨】形式直接向对应六部派单办理。",
      "对于复杂票拟需求，以【传旨】形式发内阁票拟。内阁回报票拟后，呈皇帝批红。批红后再传旨六部执行。",
      "对于需要多方独立审议（廷议）的复杂需求，建议用户切换至内阁（empire-cabinet），由内阁主代理召大学士廷议。",
      "发部无需批红。涉及破坏性命令、外部网络、密钥、生产数据时必须请旨。",
      "六部办毕后以【本部复奏】回报，司礼监汇总呈报。",
      EUNUCH_DECREE,
      MINISTRY_FORM,
    ].join("\n\n");
  }

  if (role.id.startsWith("empire-grand-secretary")) {
    return [
      workflow,
      toneRule,
      `你是${role.title}。你的职责是独立审议同一需求，不和其他大学士串联。`,
      "输出必须包含：你的理解、建议方案、主要风险、需要皇帝圣裁的问题。",
      "你不直接派工，不直接修改代码。",
    ].join("\n\n");
  }

  return [
    workflow,
    toneRule,
    `你是${role.title}，职责：${role.description}`,
    "只在职责范围内办理。若任务越界，复奏说明应交哪个部门。",
    "涉及破坏性命令、外部网络、密钥、生产数据时必须请旨。",
    MINISTRY_FORM,
  ].join("\n\n");
}
```

- [ ] **Step 3: 运行 agents 测试确认通过**

```bash
npm run test -- src/__tests__/agents.test.ts
```

Expected: PASS — 8 tests pass.

---

### Task 3: 更新 plugin.test.ts 与 index.ts — RED→GREEN

**Files:**
- Modify: `src/__tests__/plugin.test.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: plugin.test.ts 新增 default_agent 断言 (RED)**

在 `src/__tests__/plugin.test.ts` 的 "注册 cabinet、hidden grand secretary、works ministry 与廷议 command" 测试中增加：

```typescript
expect(config.default_agent).toBe("empire-eunuch");
```

完整测试块：

```typescript
describe("plugin module", () => {
  it("注册 cabinet（mode:all）、hidden grand secretary、works ministry 与廷议 command，设 default_agent 为司礼监", async () => {
    const hooks = await pluginModule.server(fakeInput() as never, {
      models: { "empire-cabinet": "cockpit/gpt-5.4" },
    });

    const config: Record<string, unknown> = {};
    await hooks.config?.(config as never);

    const agents = (config.agent ?? {}) as Record<string, Record<string, unknown>>;
    const commands = (config.command ?? {}) as Record<string, Record<string, unknown>>;

    expect(config.default_agent).toBe("empire-eunuch");
    expect(agents["empire-cabinet"]?.model).toBe("cockpit/gpt-5.4");
    expect(agents["empire-cabinet"]?.mode).toBe("all");
    expect(agents["empire-grand-secretary-a"]?.hidden).toBe(true);
    expect(agents["empire-ministry-works"]?.hidden).toBe(false);
    expect(Object.keys(commands)).toEqual(["廷议"]);
    expect(commands["廷议"]?.agent).toBe("empire-cabinet");
  });
```

- [ ] **Step 2: 运行 plugin 测试确认失败**

```bash
npm run test -- src/__tests__/plugin.test.ts
```

Expected: FAIL — `config.default_agent` 为 undefined。

- [ ] **Step 3: index.ts 设 default_agent (GREEN)**

```typescript
import type { PluginModule, PluginOptions } from "@opencode-ai/plugin";
import { buildEmpireAgents, normalizeOptions } from "./agents.js";
import { buildEmpireCommands } from "./commands.js";
import { mergeEmpireConfig } from "./config-merge.js";
import { loadEmpireOptions } from "./config-file.js";
import type { EmpireOptions } from "./types.js";

async function parseOptions(options: PluginOptions | undefined): Promise<EmpireOptions> {
  return normalizeOptions(await loadEmpireOptions({ tupleOptions: options }));
}

const module: PluginModule = {
  id: "opencode-empire",
  async server(_input, options) {
    const empireOptions = await parseOptions(options);

    return {
      async config(config) {
        config.default_agent = "empire-eunuch";
        mergeEmpireConfig(config, {
          agent: buildEmpireAgents(empireOptions),
          command: buildEmpireCommands(),
        });
      },
    };
  },
};

export default module;
```

- [ ] **Step 4: 运行 plugin 测试确认通过**

```bash
npm run test -- src/__tests__/plugin.test.ts
```

Expected: PASS — 2 tests pass.

---

### Task 4: 更新 README.md

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 同步 README 入口定位、agent 表格、工作流**

```markdown
# opencode-empire

`opencode-empire` 是一个 OpenCode 插件，用于提供带有"司礼监/内阁/六部"风格的多 agent 编排体验。

启动后默认选中司礼监（empire-eunuch）。日常任务司礼监直接处理或以传旨形式向六部及内阁派单；需要廷议时切换至内阁（empire-cabinet）。

## Agents

| Agent | 可见 | 模式 | 职责 |
| --- | --- | --- | --- |
| `empire-eunuch` | 是 | primary | 司礼监：日常主 agent。日常问答与简单任务直办，以传旨向六部/内阁派单；需廷议时建议切换内阁 |
| `empire-cabinet` | 是 | all | 内阁：主/子代理。主代理负责票拟、廷议、发部、复奏。子代理被司礼监传旨调用直出票拟 |
| `empire-grand-secretary-a` | 否 | subagent | 隐藏大学士，负责独立审议 |
| `empire-grand-secretary-b` | 否 | subagent | 隐藏大学士，负责独立审议 |
| `empire-grand-secretary-c` | 否 | subagent | 隐藏大学士，负责独立审议 |
| `empire-ministry-personnel` | 是 | subagent | 吏部：执行方案 |
| `empire-ministry-revenue` | 是 | subagent | 户部：代码探索 |
| `empire-ministry-rites` | 是 | subagent | 礼部：方案审核与交互文案 |
| `empire-ministry-war` | 是 | subagent | 兵部：执行流程与自动化 |
| `empire-ministry-justice` | 是 | subagent | 刑部：代码审查与测试把关 |
| `empire-ministry-works` | 是 | subagent | 工部：代码实现 |

## Command

- `/廷议`：请三位隐藏大学士独立审议（需在 empire-cabinet 主代理下使用）。

## Workflow

1. 日常使用 `empire-eunuch`（司礼监，默认选中）。
2. 自然描述任务。
3. 简单任务司礼监直接处理。六部任务（探索/实现/审查）司礼监以传旨直接发部，办理后复奏。
4. 复杂票拟需求：司礼监传旨内阁票拟 → 内阁回报票拟 → 司礼监呈皇帝批红 → 批红后传旨六部执行。
5. 需要多方独立审议（廷议）时，切换到 `empire-cabinet`，使用 `/廷议` 召大学士。
6. 六部办理后，审阅 `【内阁复奏】` 或 `【本部复奏】`。

## 传旨格式

```
【传旨】
着令：[内阁/某部]
差事：[任务描述]
办毕复奏。
```
```

- [ ] **Step 2: 运行完整验证**

```bash
npm run verify
```

Expected: 类型检查通过，所有 24 测试通过，构建成功。

---

### Self-Review

**1. Spec coverage:**
- default_agent → Task 3 ✓
- 内阁 mode:all → Task 2 ✓
- 传旨模板 → Task 2 ✓
- 司礼监 prompt（日常入口/传旨六部/传旨内阁/建议切换） → Task 2 ✓
- 内阁 prompt（主/子代理双模式） → Task 2 ✓
- README 同步 → Task 4 ✓
- 测试覆盖 → Tasks 1, 3 ✓

**2. Placeholder scan:** 无 TBD/TODO/占位符。

**3. Type consistency:** defaults.ts 中 mode 值 `"all"` 与 agents.test.ts 断言一致；prompt 断言关键字与 prompts.ts 实际字符串一致。
