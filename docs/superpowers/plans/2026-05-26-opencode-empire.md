# opencode-empire Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an OpenCode plugin that registers an `empire-cabinet` primary agent, three hidden grand-secretary subagents, six visible ministry subagents, and command shortcuts for the confirmed “票拟 -> 批红 -> 发部 -> 办理 -> 复奏” workflow.

**Architecture:** The plugin is a TypeScript ESM package using `@opencode-ai/plugin` hooks. `src/index.ts` exposes the plugin server, `src/agents.ts` builds agent config from typed options and prompt builders, `src/commands.ts` builds command config, and small modules keep role metadata, prompt text, and config merging independent and testable.

**Tech Stack:** TypeScript, Node ESM, `@opencode-ai/plugin@1.3.15`, Vitest, npm scripts.

---

## File Structure

- Create `package.json`: package metadata, build/test/typecheck scripts, plugin dependency, exports.
- Create `tsconfig.json`: strict TypeScript ESM compiler settings.
- Create `vitest.config.ts`: Vitest config for TypeScript tests.
- Create `src/types.ts`: public plugin option types and role identifiers.
- Create `src/defaults.ts`: default model IDs, tone, permissions, and command labels.
- Create `src/prompts.ts`: role prompt builders and shared workflow text.
- Create `src/agents.ts`: generate OpenCode `agent` config for cabinet, hidden grand secretaries, and visible ministries.
- Create `src/commands.ts`: generate OpenCode `command` config.
- Create `src/config-merge.ts`: merge plugin generated config into user config without deleting existing agents or commands.
- Create `src/index.ts`: OpenCode plugin entrypoint and option parsing.
- Create `src/__tests__/agents.test.ts`: verifies roles, hidden flags, models, permissions.
- Create `src/__tests__/commands.test.ts`: verifies command templates and target agent.
- Create `src/__tests__/config-merge.test.ts`: verifies existing OpenCode config is preserved.
- Create `src/__tests__/plugin.test.ts`: verifies plugin hook mutates config as expected.
- Create `README.md`: installation, configuration, command, and workflow guide.

## Task 1: Package Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/types.ts`

- [ ] **Step 1: Create package metadata**

Write `package.json`:

```json
{
  "name": "opencode-empire",
  "version": "0.1.0",
  "description": "OpenCode imperial multi-agent orchestration plugin.",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist",
    "README.md"
  ],
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run",
    "verify": "npm run typecheck && npm run test && npm run build"
  },
  "keywords": [
    "opencode",
    "plugin",
    "agent",
    "multi-agent"
  ],
  "license": "MIT",
  "dependencies": {
    "@opencode-ai/plugin": "1.3.15"
  },
  "devDependencies": {
    "@types/node": "^22.13.9",
    "typescript": "^5.8.2",
    "vitest": "^2.1.9"
  }
}
```

- [ ] **Step 2: Add TypeScript config**

Write `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src",
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 3: Add Vitest config**

Write `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    globals: false,
  },
});
```

- [ ] **Step 4: Add shared types**

Write `src/types.ts`:

```ts
export type ToneLevel = "light" | "medium" | "high";

export type EmpireRoleId =
  | "empire-cabinet"
  | "empire-grand-secretary-a"
  | "empire-grand-secretary-b"
  | "empire-grand-secretary-c"
  | "empire-ministry-personnel"
  | "empire-ministry-revenue"
  | "empire-ministry-rites"
  | "empire-ministry-war"
  | "empire-ministry-justice"
  | "empire-ministry-works";

export type ModelMap = Partial<Record<EmpireRoleId, string>>;

export interface EmpireOptions {
  models?: ModelMap;
  tone?: ToneLevel;
  requireDispatchApproval?: boolean;
  disabledRoles?: EmpireRoleId[];
}

export interface EmpireRole {
  id: EmpireRoleId;
  title: string;
  office: string;
  description: string;
  mode: "primary" | "subagent";
  hidden?: boolean;
  canEdit: boolean;
  defaultModel: string;
}
```

- [ ] **Step 5: Install dependencies**

Run:

```bash
npm install
```

Expected: `package-lock.json` is created and npm installs TypeScript, Vitest, and `@opencode-ai/plugin`.

- [ ] **Step 6: Verify scaffold**

Run:

```bash
npm run typecheck
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 7: Commit scaffold**

Run:

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts src/types.ts
git commit -m "chore: scaffold opencode empire plugin"
```

## Task 2: Role Defaults and Agent Generation

**Files:**
- Create: `src/defaults.ts`
- Create: `src/prompts.ts`
- Create: `src/agents.ts`
- Test: `src/__tests__/agents.test.ts`

- [ ] **Step 1: Write failing agent tests**

Write `src/__tests__/agents.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildEmpireAgents } from "../agents.js";

describe("buildEmpireAgents", () => {
  it("registers cabinet, hidden grand secretaries, and visible ministries", () => {
    const agents = buildEmpireAgents({});

    expect(agents["empire-cabinet"]?.mode).toBe("primary");
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
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm run test -- src/__tests__/agents.test.ts
```

Expected: FAIL because `src/agents.ts` does not exist.

- [ ] **Step 3: Add role defaults**

Write `src/defaults.ts`:

```ts
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
  {
    id: "empire-cabinet",
    title: "内阁",
    office: "内阁",
    description: "主 agent。负责听旨、追问、廷议、票拟、请批红、发部和复奏。",
    mode: "primary",
    canEdit: false,
    defaultModel: DEFAULT_MODELS.cabinet,
  },
  {
    id: "empire-grand-secretary-a",
    title: "内阁大学士甲",
    office: "内阁",
    description: "隐藏 subagent。独立审议需求，输出共识、分歧、风险和待裁决事项。",
    mode: "subagent",
    hidden: true,
    canEdit: false,
    defaultModel: DEFAULT_MODELS.strong,
  },
  {
    id: "empire-grand-secretary-b",
    title: "内阁大学士乙",
    office: "内阁",
    description: "隐藏 subagent。独立审议需求，输出共识、分歧、风险和待裁决事项。",
    mode: "subagent",
    hidden: true,
    canEdit: false,
    defaultModel: DEFAULT_MODELS.standard,
  },
  {
    id: "empire-grand-secretary-c",
    title: "内阁大学士丙",
    office: "内阁",
    description: "隐藏 subagent。独立审议需求，输出共识、分歧、风险和待裁决事项。",
    mode: "subagent",
    hidden: true,
    canEdit: false,
    defaultModel: DEFAULT_MODELS.fast,
  },
  {
    id: "empire-ministry-personnel",
    title: "吏部",
    office: "吏部",
    description: "可见 subagent。负责把已批红票拟转成执行方案。",
    mode: "subagent",
    hidden: false,
    canEdit: false,
    defaultModel: DEFAULT_MODELS.standard,
  },
  {
    id: "empire-ministry-revenue",
    title: "户部",
    office: "户部",
    description: "可见 subagent。负责代码探索、仓库舆图、相关文件和依赖定位。",
    mode: "subagent",
    hidden: false,
    canEdit: false,
    defaultModel: DEFAULT_MODELS.fast,
  },
  {
    id: "empire-ministry-rites",
    title: "礼部",
    office: "礼部",
    description: "可见 subagent。负责方案审核、交互文案、角色口吻和文档表达。",
    mode: "subagent",
    hidden: false,
    canEdit: false,
    defaultModel: DEFAULT_MODELS.standard,
  },
  {
    id: "empire-ministry-war",
    title: "兵部",
    office: "兵部",
    description: "可见 subagent。负责执行流程、自动化、并发派发和失败重试建议。",
    mode: "subagent",
    hidden: false,
    canEdit: false,
    defaultModel: DEFAULT_MODELS.standard,
  },
  {
    id: "empire-ministry-justice",
    title: "刑部",
    office: "刑部",
    description: "可见 subagent。负责代码审查、测试把关、权限和风险审查。",
    mode: "subagent",
    hidden: false,
    canEdit: false,
    defaultModel: DEFAULT_MODELS.strong,
  },
  {
    id: "empire-ministry-works",
    title: "工部",
    office: "工部",
    description: "可见 subagent。负责代码实现、构建配置、类型修复和集成落地。",
    mode: "subagent",
    hidden: false,
    canEdit: true,
    defaultModel: DEFAULT_MODELS.strong,
  },
];
```

- [ ] **Step 4: Add prompt builders**

Write `src/prompts.ts`:

```ts
import type { EmpireRole, ToneLevel } from "./types.js";

const WORKFLOW = [
  "你必须使用中文。",
  "你运行在 opencode-empire 插件中。用户是皇帝，重要执行前必须等待批红。",
  "标准流程：听旨 -> 追问 -> 廷议 -> 票拟 -> 待批红 -> 拟派工 -> 待发部 -> 办理中 -> 复奏。",
  "角色语气为中度角色化：开头和请示可以像奏疏，文件、命令、风险、测试、验收标准必须现代清楚。",
].join("\n");

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

export function buildPrompt(role: EmpireRole, tone: ToneLevel): string {
  const toneRule = {
    light: "轻度角色化：只在称谓和标题体现官署感。",
    medium: "中度角色化：汇报像奏疏，但工程事实必须直给。",
    high: "高度角色化：可以更沉浸，但不得遮蔽工程事实。",
  }[tone];

  if (role.id === "empire-cabinet") {
    return [
      WORKFLOW,
      toneRule,
      "你是内阁主 agent，是用户的主要对话入口。",
      "普通问答可以直接回答；复杂需求、代码修改、设计、审查、派工任务应进入票拟流程。",
      "你不直接修改代码。代码探索交户部，代码实现交工部，代码审查交刑部。",
      "没有用户批红，不得发部办理。",
      CABINET_FORMS,
    ].join("\n\n");
  }

  if (role.id.startsWith("empire-grand-secretary")) {
    return [
      WORKFLOW,
      toneRule,
      `你是${role.title}。你的职责是独立审议同一需求，不和其他大学士串联。`,
      "输出必须包含：你的理解、建议方案、主要风险、需要皇帝圣裁的问题。",
      "你不直接派工，不直接修改代码。",
    ].join("\n\n");
  }

  return [
    WORKFLOW,
    toneRule,
    `你是${role.title}，职责：${role.description}`,
    "只在职责范围内办理。若任务越界，复奏说明应交哪个部门。",
    "涉及破坏性命令、外部网络、密钥、生产数据时必须请旨。",
    MINISTRY_FORM,
  ].join("\n\n");
}
```

- [ ] **Step 5: Implement agent builder**

Write `src/agents.ts`:

```ts
import type { Config } from "@opencode-ai/plugin";
import { DEFAULT_REQUIRE_DISPATCH_APPROVAL, DEFAULT_TONE, EMPIRE_ROLES } from "./defaults.js";
import { buildPrompt } from "./prompts.js";
import type { EmpireOptions, EmpireRoleId } from "./types.js";

type AgentConfig = NonNullable<Config["agent"]>[string];

function permissionFor(canEdit: boolean): AgentConfig["permission"] {
  return {
    edit: canEdit ? "ask" : "deny",
    bash: "ask",
    webfetch: "ask",
    external_directory: "ask",
  };
}

export function normalizeOptions(options: EmpireOptions): Required<EmpireOptions> {
  return {
    models: options.models ?? {},
    tone: options.tone ?? DEFAULT_TONE,
    requireDispatchApproval: options.requireDispatchApproval ?? DEFAULT_REQUIRE_DISPATCH_APPROVAL,
    disabledRoles: options.disabledRoles ?? [],
  };
}

export function buildEmpireAgents(options: EmpireOptions): NonNullable<Config["agent"]> {
  const normalized = normalizeOptions(options);
  const disabled = new Set<EmpireRoleId>(normalized.disabledRoles);
  const agents: NonNullable<Config["agent"]> = {};

  for (const role of EMPIRE_ROLES) {
    if (disabled.has(role.id)) {
      continue;
    }

    agents[role.id] = {
      description: role.description,
      mode: role.mode,
      hidden: role.hidden ?? false,
      model: normalized.models[role.id] ?? role.defaultModel,
      prompt: buildPrompt(role, normalized.tone),
      temperature: 0.1,
      permission: permissionFor(role.canEdit),
    };
  }

  return agents;
}
```

- [ ] **Step 6: Run agent tests**

Run:

```bash
npm run test -- src/__tests__/agents.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit agent generation**

Run:

```bash
git add src/defaults.ts src/prompts.ts src/agents.ts src/__tests__/agents.test.ts
git commit -m "feat: generate empire agents"
```

## Task 3: Command Generation

**Files:**
- Create: `src/commands.ts`
- Test: `src/__tests__/commands.test.ts`

- [ ] **Step 1: Write failing command tests**

Write `src/__tests__/commands.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildEmpireCommands } from "../commands.js";

describe("buildEmpireCommands", () => {
  it("registers all imperial workflow commands", () => {
    const commands = buildEmpireCommands();

    expect(Object.keys(commands).sort()).toEqual([
      "发部",
      "复奏",
      "廷议",
      "批红",
      "票拟",
      "驳回",
    ]);
  });

  it("routes commands to the cabinet", () => {
    const commands = buildEmpireCommands();

    expect(commands["票拟"]?.agent).toBe("empire-cabinet");
    expect(commands["发部"]?.agent).toBe("empire-cabinet");
    expect(commands["复奏"]?.agent).toBe("empire-cabinet");
  });

  it("uses command templates that preserve user arguments", () => {
    const commands = buildEmpireCommands();

    expect(commands["驳回"]?.template).toContain("$ARGUMENTS");
    expect(commands["批红"]?.template).toContain("$ARGUMENTS");
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm run test -- src/__tests__/commands.test.ts
```

Expected: FAIL because `src/commands.ts` does not exist.

- [ ] **Step 3: Implement command builder**

Write `src/commands.ts`:

```ts
import type { Config } from "@opencode-ai/plugin";

type CommandConfig = NonNullable<Config["command"]>;

const CABINET_AGENT = "empire-cabinet";

export function buildEmpireCommands(): CommandConfig {
  return {
    票拟: {
      description: "强制进入内阁需求澄清与票拟流程",
      agent: CABINET_AGENT,
      template: "请以内阁身份对以下旨意进入票拟流程。若需求不清，一次只追问一个关键问题。\n\n$ARGUMENTS",
    },
    廷议: {
      description: "请三位内阁大学士独立审议当前事项",
      agent: CABINET_AGENT,
      template: "请召三位隐藏内阁大学士独立廷议，并按共识优先格式呈报。\n\n$ARGUMENTS",
    },
    批红: {
      description: "确认某版票拟或派工单",
      agent: CABINET_AGENT,
      template: "朕批红如下。请内阁据此进入下一阶段，不得超出批红范围。\n\n$ARGUMENTS",
    },
    驳回: {
      description: "驳回当前票拟、派工单或办理结果",
      agent: CABINET_AGENT,
      template: "朕驳回如下。请内阁说明需重拟之处，并重新呈报。\n\n$ARGUMENTS",
    },
    发部: {
      description: "根据已批票拟生成六部派工建议",
      agent: CABINET_AGENT,
      template: "请内阁根据已批红内容生成【六部派工单】，等待朕再次确认后再办理。\n\n$ARGUMENTS",
    },
    复奏: {
      description: "汇总当前办理结果、证据、风险和待裁定事项",
      agent: CABINET_AGENT,
      template: "请内阁按【内阁复奏】格式汇总当前办理情况。\n\n$ARGUMENTS",
    },
  };
}
```

- [ ] **Step 4: Run command tests**

Run:

```bash
npm run test -- src/__tests__/commands.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit command generation**

Run:

```bash
git add src/commands.ts src/__tests__/commands.test.ts
git commit -m "feat: add empire workflow commands"
```

## Task 4: Config Merge and Plugin Entrypoint

**Files:**
- Create: `src/config-merge.ts`
- Create: `src/index.ts`
- Test: `src/__tests__/config-merge.test.ts`
- Test: `src/__tests__/plugin.test.ts`

- [ ] **Step 1: Write failing config merge tests**

Write `src/__tests__/config-merge.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Config } from "@opencode-ai/plugin";
import { mergeEmpireConfig } from "../config-merge.js";

describe("mergeEmpireConfig", () => {
  it("preserves existing agents and commands", () => {
    const config: Config = {
      agent: {
        "code-worker": {
          mode: "subagent",
          description: "existing worker",
          prompt: "existing prompt",
        },
      },
      command: {
        old: {
          template: "old",
          description: "old command",
        },
      },
    };

    mergeEmpireConfig(config, {
      agent: {
        "empire-cabinet": {
          mode: "primary",
          description: "cabinet",
          prompt: "cabinet prompt",
        },
      },
      command: {
        票拟: {
          agent: "empire-cabinet",
          template: "draft",
        },
      },
    });

    expect(config.agent?.["code-worker"]?.description).toBe("existing worker");
    expect(config.agent?.["empire-cabinet"]?.description).toBe("cabinet");
    expect(config.command?.old?.template).toBe("old");
    expect(config.command?.票拟?.agent).toBe("empire-cabinet");
  });
});
```

- [ ] **Step 2: Write failing plugin test**

Write `src/__tests__/plugin.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Config, PluginInput } from "@opencode-ai/plugin";
import pluginModule from "../index.js";

function fakeInput(): PluginInput {
  return {
    client: {} as PluginInput["client"],
    project: {} as PluginInput["project"],
    directory: "/tmp/project",
    worktree: "/tmp/project",
    serverUrl: new URL("http://localhost:4096"),
    $: {} as PluginInput["$"],
  };
}

describe("opencode-empire plugin", () => {
  it("registers config hook with agents and commands", async () => {
    const hooks = await pluginModule.server(fakeInput(), {
      models: {
        "empire-cabinet": "cockpit/gpt-5.4",
      },
    });
    const config: Config = {};

    await hooks.config?.(config);

    expect(config.agent?.["empire-cabinet"]?.mode).toBe("primary");
    expect(config.agent?.["empire-grand-secretary-a"]?.hidden).toBe(true);
    expect(config.agent?.["empire-ministry-works"]?.hidden).toBe(false);
    expect(config.command?.票拟?.agent).toBe("empire-cabinet");
  });
});
```

- [ ] **Step 3: Run tests to verify failure**

Run:

```bash
npm run test -- src/__tests__/config-merge.test.ts src/__tests__/plugin.test.ts
```

Expected: FAIL because `src/config-merge.ts` and `src/index.ts` do not exist.

- [ ] **Step 4: Implement config merge**

Write `src/config-merge.ts`:

```ts
import type { Config } from "@opencode-ai/plugin";

export interface EmpireConfigPatch {
  agent: NonNullable<Config["agent"]>;
  command: NonNullable<Config["command"]>;
}

export function mergeEmpireConfig(config: Config, patch: EmpireConfigPatch): void {
  config.agent = {
    ...(config.agent ?? {}),
    ...patch.agent,
  };

  config.command = {
    ...(config.command ?? {}),
    ...patch.command,
  };
}
```

- [ ] **Step 5: Implement plugin entrypoint**

Write `src/index.ts`:

```ts
import type { PluginModule, PluginOptions } from "@opencode-ai/plugin";
import { buildEmpireAgents, normalizeOptions } from "./agents.js";
import { buildEmpireCommands } from "./commands.js";
import { mergeEmpireConfig } from "./config-merge.js";
import type { EmpireOptions } from "./types.js";

function parseOptions(options: PluginOptions | undefined): EmpireOptions {
  const raw = (options ?? {}) as EmpireOptions;
  return normalizeOptions(raw);
}

const module: PluginModule = {
  id: "opencode-empire",
  async server(_input, options) {
    const empireOptions = parseOptions(options);

    return {
      async config(config) {
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

- [ ] **Step 6: Run plugin tests**

Run:

```bash
npm run test -- src/__tests__/config-merge.test.ts src/__tests__/plugin.test.ts
```

Expected: PASS.

- [ ] **Step 7: Run full verification**

Run:

```bash
npm run verify
```

Expected: PASS for typecheck, tests, and build.

- [ ] **Step 8: Commit plugin entrypoint**

Run:

```bash
git add src/config-merge.ts src/index.ts src/__tests__/config-merge.test.ts src/__tests__/plugin.test.ts
git commit -m "feat: register empire plugin config"
```

## Task 5: Prompt Coverage Tests

**Files:**
- Modify: `src/__tests__/agents.test.ts`

- [ ] **Step 1: Add prompt coverage tests**

Append to `src/__tests__/agents.test.ts` inside the existing `describe` block:

```ts
  it("includes required cabinet forms and approval boundary", () => {
    const agents = buildEmpireAgents({});
    const prompt = agents["empire-cabinet"]?.prompt ?? "";

    expect(prompt).toContain("【内阁票拟】");
    expect(prompt).toContain("【六部派工单】");
    expect(prompt).toContain("【内阁复奏】");
    expect(prompt).toContain("没有用户批红，不得发部办理");
  });

  it("keeps ministry prompts within department responsibility", () => {
    const agents = buildEmpireAgents({});

    expect(agents["empire-ministry-revenue"]?.prompt).toContain("代码探索");
    expect(agents["empire-ministry-works"]?.prompt).toContain("代码实现");
    expect(agents["empire-ministry-justice"]?.prompt).toContain("代码审查");
  });
```

- [ ] **Step 2: Run prompt tests**

Run:

```bash
npm run test -- src/__tests__/agents.test.ts
```

Expected: PASS.

- [ ] **Step 3: Commit prompt coverage**

Run:

```bash
git add src/__tests__/agents.test.ts
git commit -m "test: cover empire prompt requirements"
```

## Task 6: README and Usage Guide

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

Write `README.md`:

```md
# opencode-empire

`opencode-empire` is an OpenCode plugin for imperial-style multi-agent orchestration.

You talk to `empire-cabinet`. The cabinet clarifies requirements, convenes three hidden grand secretaries, drafts a proposal, asks for approval, prepares a ministry dispatch, and summarizes results.

## Agents

| Agent | Visible | Role |
| --- | --- | --- |
| `empire-cabinet` | Yes | Cabinet primary agent for 听旨、追问、廷议、票拟、批红、发部、复奏 |
| `empire-grand-secretary-a` | No | Hidden grand secretary for independent deliberation |
| `empire-grand-secretary-b` | No | Hidden grand secretary for independent deliberation |
| `empire-grand-secretary-c` | No | Hidden grand secretary for independent deliberation |
| `empire-ministry-personnel` | Yes | 吏部: execution plan |
| `empire-ministry-revenue` | Yes | 户部: code exploration |
| `empire-ministry-rites` | Yes | 礼部: plan review and interaction copy |
| `empire-ministry-war` | Yes | 兵部: execution and automation |
| `empire-ministry-justice` | Yes | 刑部: code review and test gate |
| `empire-ministry-works` | Yes | 工部: code implementation |

## Commands

- `/票拟`: enter proposal drafting.
- `/廷议`: ask the three hidden grand secretaries to deliberate.
- `/批红`: approve a proposal or dispatch.
- `/驳回`: reject and ask the cabinet to redraft.
- `/发部`: prepare ministry dispatch.
- `/复奏`: summarize current results, evidence, risks, and decisions.

## Configuration

```json
{
  "plugin": [
    [
      "opencode-empire",
      {
        "tone": "medium",
        "requireDispatchApproval": true,
        "models": {
          "empire-cabinet": "cockpit/gpt-5.4",
          "empire-ministry-works": "cockpit/gpt-5.5",
          "empire-ministry-justice": "cockpit/gpt-5.5",
          "empire-grand-secretary-a": "cockpit/gpt-5.5",
          "empire-grand-secretary-b": "cockpit/gpt-5.4",
          "empire-grand-secretary-c": "opencode-go/deepseek-v4-flash"
        }
      }
    ]
  ]
}
```

## Workflow

1. Choose `empire-cabinet`.
2. Describe the task naturally.
3. The cabinet asks one clarifying question at a time when needed.
4. The cabinet presents `【内阁票拟】`.
5. Approve with `/批红`.
6. Ask for `/发部` or tell the cabinet to dispatch ministries.
7. Review `【六部派工单】`.
8. Approve dispatch.
9. Review `【内阁复奏】` after ministries report back.

## Development

```bash
npm install
npm run verify
```
```

- [ ] **Step 2: Commit README**

Run:

```bash
git add README.md
git commit -m "docs: add empire usage guide"
```

## Task 7: Package Verification

**Files:**
- Modify only if verification exposes a concrete issue.

- [ ] **Step 1: Run full verification**

Run:

```bash
npm run verify
```

Expected: PASS.

- [ ] **Step 2: Run dry package check**

Run:

```bash
npm pack --dry-run
```

Expected: output includes `dist/index.js`, `dist/index.d.ts`, `README.md`, and `package.json`.

- [ ] **Step 3: Inspect git status**

Run:

```bash
git status --short
```

Expected: no unstaged changes after all previous commits, or only intentional generated build artifacts if the package build policy keeps `dist/` uncommitted.

- [ ] **Step 4: Commit any verification fix**

If Step 1 or Step 2 required a concrete source, test, or docs fix, commit exactly those files:

```bash
git add package.json tsconfig.json src README.md
git commit -m "chore: finalize package verification"
```

If no files changed, do not create an empty commit.

## Self-Review

- Spec coverage: The plan covers the cabinet primary agent, hidden grand secretaries, visible ministries, mixed model overrides, command entrypoints, approval boundary, document forms, config merge, README, and verification.
- Placeholder scan: This plan contains no unfinished placeholder markers, no undefined future module names, and no open-ended validation steps.
- Type consistency: Role IDs are defined once in `src/types.ts`, reused by defaults, tests, options, and README. Config types come from `@opencode-ai/plugin`.
- Scope check: The plan builds the first plugin version only. It does not implement long-term persistence, database state, runtime Task interception, or fully automatic execution.
