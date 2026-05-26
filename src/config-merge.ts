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
