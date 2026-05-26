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
      prompt: buildPrompt(role, normalized.tone, normalized.requireDispatchApproval),
      temperature: 0.1,
      permission: permissionFor(role.canEdit),
    };
  }

  return agents;
}
