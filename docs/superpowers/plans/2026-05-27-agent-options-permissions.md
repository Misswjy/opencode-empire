# Agent Scoped Model Options And Permissions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an `agents` config block so each empire agent can configure `model`, reasoning-style `options`, and partial `permission` overrides in one place.

**Architecture:** Keep generated agent defaults in `buildEmpireAgents`, then layer agent-scoped config on top. Preserve existing `models` support, but let `agents[roleId].model` win when both are present.

**Tech Stack:** TypeScript, `@opencode-ai/plugin` config types, Vitest, JSON Schema, README docs.

---

## File Structure

- Modify: `src/types.ts`
  - Add agent-scoped config types to `EmpireOptions`.
- Modify: `src/config-file.ts`
  - Deep-merge `agents` from file config and tuple plugin options.
- Modify: `src/agents.ts`
  - Apply `agents[roleId].model`, `agents[roleId].options`, and `agents[roleId].permission` while generating opencode agents.
- Modify: `src/__tests__/agents.test.ts`
  - Cover model precedence, options passthrough, and permission shallow merge.
- Modify: `src/__tests__/config-file.test.ts`
  - Cover nested merge behavior for file and tuple `agents` config.
- Modify: `opencode-empire.schema.json`
  - Add schema for `agents` keyed by existing `EmpireRoleId`.
- Modify: `src/install.ts`
  - Add discoverable default `agents` entries.
- Modify: `README.md`
  - Document the new agent-scoped shape and precedence with legacy `models`.

## Task 1: Add Agent-Scoped Types

**Files:**
- Modify: `src/types.ts`
- Test: `npm run typecheck`

- [ ] **Step 1: Add type definitions**

Replace `src/types.ts` with:

```ts
import type { Config } from "@opencode-ai/plugin";

export type ToneLevel = "light" | "medium" | "high";

export type EmpireRoleId =
  | "empire-cabinet"
  | "empire-eunuch"
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

type AgentConfig = NonNullable<NonNullable<Config["agent"]>[string]>;

export interface EmpireAgentOptions {
  model?: string;
  options?: AgentConfig["options"];
  permission?: AgentConfig["permission"];
}

export type AgentOptionsMap = Partial<Record<EmpireRoleId, EmpireAgentOptions>>;

export interface EmpireOptions {
  models?: ModelMap;
  agents?: AgentOptionsMap;
  tone?: ToneLevel;
  requireDispatchApproval?: boolean;
  disabledRoles?: EmpireRoleId[];
}

export interface EmpireRole {
  id: EmpireRoleId;
  title: string;
  office: string;
  description: string;
  mode: "primary" | "subagent" | "all";
  hidden?: boolean;
  canEdit: boolean;
  defaultModel: string;
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: TypeScript may fail because `normalizeOptions` does not yet include required `agents`. That failure is acceptable at this step.

## Task 2: Test Agent Generation Behavior

**Files:**
- Modify: `src/__tests__/agents.test.ts`

- [ ] **Step 1: Add failing tests**

Append these tests inside the existing `describe("buildEmpireAgents", () => { ... })` block in `src/__tests__/agents.test.ts`:

```ts
  it("uses agent-scoped model over legacy model overrides", () => {
    const agents = buildEmpireAgents({
      models: {
        "empire-cabinet": "cockpit/gpt-5.4",
      },
      agents: {
        "empire-cabinet": {
          model: "cockpit/gpt-5.5",
        },
      },
    });

    expect(agents["empire-cabinet"]?.model).toBe("cockpit/gpt-5.5");
  });

  it("passes agent-scoped options to generated agents", () => {
    const agents = buildEmpireAgents({
      agents: {
        "empire-cabinet": {
          options: { reasoningEffort: "high" },
        },
      },
    });

    expect(agents["empire-cabinet"]?.options).toEqual({ reasoningEffort: "high" });
  });

  it("shallow-merges agent-scoped permissions with defaults", () => {
    const agents = buildEmpireAgents({
      agents: {
        "empire-ministry-revenue": {
          permission: { webfetch: "allow" },
        },
      },
    });

    expect(agents["empire-ministry-revenue"]?.permission).toEqual({
      edit: "deny",
      bash: "ask",
      webfetch: "allow",
      external_directory: "ask",
    });
  });
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm run test -- src/__tests__/agents.test.ts`

Expected: FAIL. The failures should show `agents` config is ignored or not typed yet.

## Task 3: Implement Agent Generation Behavior

**Files:**
- Modify: `src/agents.ts`
- Test: `src/__tests__/agents.test.ts`

- [ ] **Step 1: Update `normalizeOptions` and `buildEmpireAgents`**

Replace `src/agents.ts` with:

```ts
import type { Config } from "@opencode-ai/plugin";
import { DEFAULT_REQUIRE_DISPATCH_APPROVAL, DEFAULT_TONE, EMPIRE_ROLES } from "./defaults.js";
import { buildPrompt } from "./prompts.js";
import type { EmpireOptions, EmpireRoleId } from "./types.js";

type AgentConfig = NonNullable<NonNullable<Config["agent"]>[string]>;

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
    agents: options.agents ?? {},
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

    const agentOptions = normalized.agents[role.id];
    const permission = {
      ...permissionFor(role.canEdit),
      ...agentOptions?.permission,
    };

    agents[role.id] = {
      description: role.description,
      mode: role.mode,
      hidden: role.hidden ?? false,
      model: agentOptions?.model ?? normalized.models[role.id] ?? role.defaultModel,
      prompt: buildPrompt(role, normalized.tone, normalized.requireDispatchApproval),
      temperature: 0.1,
      permission,
    };

    if (agentOptions?.options) {
      agents[role.id].options = agentOptions.options;
    }
  }

  return agents;
}
```

- [ ] **Step 2: Run focused agent tests**

Run: `npm run test -- src/__tests__/agents.test.ts`

Expected: PASS.

## Task 4: Test Config Merge Behavior

**Files:**
- Modify: `src/__tests__/config-file.test.ts`

- [ ] **Step 1: Add failing merge test**

Append this test inside the existing `describe("loadEmpireOptions", () => { ... })` block in `src/__tests__/config-file.test.ts`:

```ts
  it("merges file and tuple agent-scoped config per agent", async () => {
    const home = await makeHome();
    await writeFile(
      getEmpireConfigPath(home),
      JSON.stringify({
        agents: {
          "empire-cabinet": {
            model: "cockpit/gpt-5.4",
            options: { reasoningEffort: "medium", cache: true },
            permission: { bash: "ask", edit: "deny" },
          },
        },
      }),
    );

    await expect(
      loadEmpireOptions({
        home,
        tupleOptions: {
          agents: {
            "empire-cabinet": {
              model: "cockpit/gpt-5.5",
              options: { reasoningEffort: "high" },
              permission: { webfetch: "allow" },
            },
          },
        },
      }),
    ).resolves.toMatchObject({
      agents: {
        "empire-cabinet": {
          model: "cockpit/gpt-5.5",
          options: { reasoningEffort: "high", cache: true },
          permission: { bash: "ask", edit: "deny", webfetch: "allow" },
        },
      },
    });
  });
```

- [ ] **Step 2: Run focused config-file test and confirm failure**

Run: `npm run test -- src/__tests__/config-file.test.ts`

Expected: FAIL because `mergeEmpireOptions` does not merge `agents` yet.

## Task 5: Implement Config Merge Behavior

**Files:**
- Modify: `src/config-file.ts`
- Test: `src/__tests__/config-file.test.ts`

- [ ] **Step 1: Add merge helper and include `agents`**

Replace `src/config-file.ts` with:

```ts
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { PluginOptions } from "@opencode-ai/plugin";
import type { AgentOptionsMap, EmpireAgentOptions, EmpireOptions, EmpireRoleId } from "./types.js";

export interface LoadEmpireOptionsInput {
  home?: string;
  tupleOptions?: PluginOptions;
}

export function getOpencodeConfigDir(home = homedir()): string {
  return join(home, ".config", "opencode");
}

export function getEmpireConfigPath(home = homedir()): string {
  return join(getOpencodeConfigDir(home), "opencode-empire.json");
}

function mergeAgentOptions(fileAgent: EmpireAgentOptions = {}, tupleAgent: EmpireAgentOptions = {}): EmpireAgentOptions {
  return {
    ...fileAgent,
    ...tupleAgent,
    options: {
      ...(fileAgent.options ?? {}),
      ...(tupleAgent.options ?? {}),
    },
    permission: {
      ...((typeof fileAgent.permission === "object" ? fileAgent.permission : {}) ?? {}),
      ...((typeof tupleAgent.permission === "object" ? tupleAgent.permission : {}) ?? {}),
    },
  };
}

function mergeAgents(fileAgents: AgentOptionsMap = {}, tupleAgents: AgentOptionsMap = {}): AgentOptionsMap {
  const roleIds = new Set<EmpireRoleId>([
    ...(Object.keys(fileAgents) as EmpireRoleId[]),
    ...(Object.keys(tupleAgents) as EmpireRoleId[]),
  ]);
  const result: AgentOptionsMap = {};

  for (const roleId of roleIds) {
    result[roleId] = mergeAgentOptions(fileAgents[roleId], tupleAgents[roleId]);
  }

  return result;
}

function mergeEmpireOptions(fileOptions: EmpireOptions, tupleOptions: EmpireOptions): EmpireOptions {
  return {
    ...fileOptions,
    ...tupleOptions,
    models: {
      ...(fileOptions.models ?? {}),
      ...(tupleOptions.models ?? {}),
    },
    agents: mergeAgents(fileOptions.agents, tupleOptions.agents),
    disabledRoles: tupleOptions.disabledRoles ?? fileOptions.disabledRoles,
  };
}

export async function loadEmpireOptions(input: LoadEmpireOptionsInput = {}): Promise<EmpireOptions> {
  const home = input.home ?? homedir();
  const tupleOptions = (input.tupleOptions ?? {}) as EmpireOptions;

  try {
    const raw = await readFile(getEmpireConfigPath(home), "utf8");
    const fileOptions = JSON.parse(raw) as EmpireOptions;
    return mergeEmpireOptions(fileOptions, tupleOptions);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return tupleOptions;
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse opencode-empire config: ${getEmpireConfigPath(home)}`, { cause: error });
    }
    throw error;
  }
}
```

- [ ] **Step 2: Run focused config-file tests**

Run: `npm run test -- src/__tests__/config-file.test.ts`

Expected: PASS.

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`

Expected: PASS.

## Task 6: Update Schema And Installer Defaults

**Files:**
- Modify: `opencode-empire.schema.json`
- Modify: `src/install.ts`
- Test: `src/__tests__/install.test.ts`

- [ ] **Step 1: Update JSON schema**

In `opencode-empire.schema.json`, add this property after the existing `models` property:

```json
    "agents": {
      "type": "object",
      "properties": {
        "empire-cabinet": { "$ref": "#/$defs/EmpireAgentOptions" },
        "empire-eunuch": { "$ref": "#/$defs/EmpireAgentOptions" },
        "empire-grand-secretary-a": { "$ref": "#/$defs/EmpireAgentOptions" },
        "empire-grand-secretary-b": { "$ref": "#/$defs/EmpireAgentOptions" },
        "empire-grand-secretary-c": { "$ref": "#/$defs/EmpireAgentOptions" },
        "empire-ministry-personnel": { "$ref": "#/$defs/EmpireAgentOptions" },
        "empire-ministry-revenue": { "$ref": "#/$defs/EmpireAgentOptions" },
        "empire-ministry-rites": { "$ref": "#/$defs/EmpireAgentOptions" },
        "empire-ministry-war": { "$ref": "#/$defs/EmpireAgentOptions" },
        "empire-ministry-justice": { "$ref": "#/$defs/EmpireAgentOptions" },
        "empire-ministry-works": { "$ref": "#/$defs/EmpireAgentOptions" }
      },
      "additionalProperties": false
    }
```

Add these definitions inside `$defs` after `EmpireRoleId`:

```json
    "PermissionAction": {
      "type": "string",
      "enum": ["ask", "allow", "deny"]
    },
    "PermissionRule": {
      "oneOf": [
        { "$ref": "#/$defs/PermissionAction" },
        {
          "type": "object",
          "additionalProperties": { "$ref": "#/$defs/PermissionAction" }
        }
      ]
    },
    "Permission": {
      "type": "object",
      "additionalProperties": { "$ref": "#/$defs/PermissionRule" }
    },
    "EmpireAgentOptions": {
      "type": "object",
      "properties": {
        "model": { "type": "string" },
        "options": { "type": "object" },
        "permission": { "$ref": "#/$defs/Permission" }
      },
      "additionalProperties": false
    }
```

Ensure commas are valid JSON after inserting the new definitions.

- [ ] **Step 2: Update installer default config**

In `src/install.ts`, add this `agents` field to `DEFAULT_EMPIRE_CONFIG` after `models`:

```ts
  agents: {
    "empire-cabinet": { model: "cockpit/gpt-5.4", options: { reasoningEffort: "medium" }, permission: { edit: "deny" } },
    "empire-eunuch": { model: "cockpit/gpt-5.4", options: { reasoningEffort: "medium" }, permission: { edit: "deny" } },
    "empire-grand-secretary-a": { model: "cockpit/gpt-5.5", options: { reasoningEffort: "high" }, permission: { edit: "deny" } },
    "empire-grand-secretary-b": { model: "cockpit/gpt-5.4", options: { reasoningEffort: "medium" }, permission: { edit: "deny" } },
    "empire-grand-secretary-c": { model: "opencode-go/deepseek-v4-flash", options: { reasoningEffort: "low" }, permission: { edit: "deny" } },
    "empire-ministry-personnel": { model: "cockpit/gpt-5.4", options: { reasoningEffort: "medium" }, permission: { edit: "deny" } },
    "empire-ministry-revenue": { model: "opencode-go/deepseek-v4-flash", options: { reasoningEffort: "low" }, permission: { edit: "deny" } },
    "empire-ministry-rites": { model: "cockpit/gpt-5.4", options: { reasoningEffort: "medium" }, permission: { edit: "deny" } },
    "empire-ministry-war": { model: "cockpit/gpt-5.4", options: { reasoningEffort: "medium" }, permission: { edit: "deny" } },
    "empire-ministry-justice": { model: "cockpit/gpt-5.5", options: { reasoningEffort: "high" }, permission: { edit: "deny" } },
    "empire-ministry-works": { model: "cockpit/gpt-5.5", options: { reasoningEffort: "high" }, permission: { edit: "ask" } },
  },
```

Keep the existing `models` field for compatibility and discoverability during migration.

- [ ] **Step 3: Run installer tests**

Run: `npm run test -- src/__tests__/install.test.ts`

Expected: PASS. Existing tests should continue to pass because they use partial object matching.

## Task 7: Update README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace configuration example**

In `README.md`, update the JSON example in the Configuration section so it includes `agents` after `models`:

```json
{
  "$schema": "https://unpkg.com/opencode-empire@latest/opencode-empire.schema.json",
  "tone": "medium",
  "requireDispatchApproval": true,
  "models": {
    "empire-cabinet": "cockpit/gpt-5.4",
    "empire-eunuch": "cockpit/gpt-5.4",
    "empire-grand-secretary-a": "cockpit/gpt-5.5",
    "empire-grand-secretary-b": "cockpit/gpt-5.4",
    "empire-grand-secretary-c": "opencode-go/deepseek-v4-flash",
    "empire-ministry-personnel": "cockpit/gpt-5.4",
    "empire-ministry-revenue": "opencode-go/deepseek-v4-flash",
    "empire-ministry-rites": "cockpit/gpt-5.4",
    "empire-ministry-war": "cockpit/gpt-5.4",
    "empire-ministry-justice": "cockpit/gpt-5.5",
    "empire-ministry-works": "cockpit/gpt-5.5"
  },
  "agents": {
    "empire-cabinet": {
      "model": "cockpit/gpt-5.5",
      "options": { "reasoningEffort": "high" },
      "permission": { "edit": "deny", "bash": "ask" }
    },
    "empire-ministry-works": {
      "model": "cockpit/gpt-5.5",
      "options": { "reasoningEffort": "high" },
      "permission": { "edit": "ask" }
    }
  },
  "disabledRoles": []
}
```

- [ ] **Step 2: Update option descriptions**

Replace the Options bullet for `models` with these bullets:

```md
- `models`：按 agent ID 覆盖模型。保留用于兼容；如果同时配置 `agents.<id>.model`，则 `agents.<id>.model` 优先。
- `agents`：按 agent ID 聚合配置单个 agent，支持 `model`、`options`、`permission`。
- `agents.<id>.options`：透传到生成的 OpenCode agent `options`，可用于 provider/model 特定的推理等级配置，例如 `{ "reasoningEffort": "high" }`。
- `agents.<id>.permission`：部分覆盖该 agent 的默认权限；只需写需要调整的权限项。
```

## Task 8: Final Verification

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run full verification**

Run: `npm run verify`

Expected: PASS. This runs prompt generation, typecheck, tests, and build.

- [ ] **Step 2: Inspect git diff**

Run: `git diff -- src/types.ts src/config-file.ts src/agents.ts src/__tests__/agents.test.ts src/__tests__/config-file.test.ts opencode-empire.schema.json src/install.ts README.md docs/superpowers/specs/2026-05-27-agent-options-permissions.md docs/superpowers/plans/2026-05-27-agent-options-permissions.md`

Expected: Diff only contains the agent-scoped config feature and associated docs/tests.

- [ ] **Step 3: Do not commit unless requested**

This repository's active instructions say only commit when explicitly requested. Stop after verification and report changed files plus test results.

## Self-Review

- Spec coverage: The plan covers agent-scoped model config, reasoning-style `options`, partial `permission`, merge behavior, schema, installer defaults, README, and tests.
- Placeholder scan: No placeholder implementation steps remain.
- Type consistency: The plan consistently uses `agents`, `model`, `options`, and `permission`, with legacy `models` precedence documented and tested.
