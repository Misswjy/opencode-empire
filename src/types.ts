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
