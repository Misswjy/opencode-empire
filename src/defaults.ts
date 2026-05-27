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
  { id: "empire-cabinet", title: "内阁首辅", office: "内阁", description: "主 agent / 子 agent。负责票拟、廷议、发部和复奏。可被司礼监传旨调用直出票拟。", mode: "all", canEdit: false, defaultModel: DEFAULT_MODELS.cabinet },
  { id: "empire-eunuch", title: "掌印太监", office: "司礼监", description: "日常主 agent。负责日常问答与简单任务，以传旨形式向六部及内阁派单；需廷议时建议切换至内阁。", mode: "primary", canEdit: false, defaultModel: DEFAULT_MODELS.standard },
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
