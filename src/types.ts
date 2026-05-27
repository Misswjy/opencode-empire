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

type AgentConfig = NonNullable<NonNullable<Config["agent"]>[string]>;

export interface EmpireAgentOptions {
  model?: string;
  options?: AgentConfig["options"];
  permission?: AgentConfig["permission"];
}

export type AgentOptionsMap = Partial<Record<EmpireRoleId, EmpireAgentOptions>>;

export interface EmpireOptions {
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
