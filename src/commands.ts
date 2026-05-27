import type { Config } from "@opencode-ai/plugin";

type CommandConfig = NonNullable<Config["command"]>;

const CABINET_AGENT = "empire-cabinet";

export function buildEmpireCommands(): CommandConfig {
  return {
    廷议: {
      description: "请三位内阁大学士独立审议当前事项",
      agent: CABINET_AGENT,
      template: "请召三位隐藏内阁大学士独立廷议，并按共识优先格式呈报。\n\n$ARGUMENTS",
    },
  };
}
