import type { Config } from "@opencode-ai/plugin";
import { DEFAULT_REQUIRE_DISPATCH_APPROVAL, DEFAULT_TONE, EMPIRE_ROLES } from "./defaults.js";
import { buildPrompt } from "./prompts.js";
import type { EmpireOptions, EmpireRoleId } from "./types.js";

type AgentConfig = NonNullable<NonNullable<Config["agent"]>[string]>;

function permissionFor(_canEdit: boolean): AgentConfig["permission"] {
  return { "*": "allow" } as AgentConfig["permission"];
}

export function normalizeOptions(options: EmpireOptions): Required<EmpireOptions> {
  return {
    agents: options.agents ?? {},
    tone: options.tone ?? DEFAULT_TONE,
    requireDispatchApproval: options.requireDispatchApproval ?? DEFAULT_REQUIRE_DISPATCH_APPROVAL,
    disabledRoles: options.disabledRoles ?? [],
  };
}

export function buildEmpireAgents(
  options: EmpireOptions,
  existingAgents: NonNullable<Config["agent"]> = {},
): NonNullable<Config["agent"]> {
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

    const config: AgentConfig = {
      description: role.description,
      mode: role.mode,
      hidden: role.hidden ?? false,
      model: agentOptions?.model ?? role.defaultModel,
      variant: existingAgents[role.id]?.variant,
      prompt: buildPrompt(role, normalized.tone, normalized.requireDispatchApproval),
      temperature: 0.1,
      permission,
    };

    agents[role.id] = config;
  }

  return agents;
}
