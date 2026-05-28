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
  { id: "empire-cabinet", title: "内阁首辅", office: "内阁", description: "内阁首辅。负责复杂事项的票拟、廷议与跨部统筹，可召大学士独立审议，获批红后发部办理。被司礼监调用时仅回呈票拟，不越级派工。", mode: "all", canEdit: false, defaultModel: DEFAULT_MODELS.cabinet },
  { id: "empire-eunuch", title: "掌印太监", office: "司礼监", description: "掌印太监。用户的默认对话入口。负责接旨、澄清需求、轻量任务自行出方案、向六部及内阁传旨分流，并在诸部回奏后汇总呈报。", mode: "primary", canEdit: false, defaultModel: DEFAULT_MODELS.standard },
  { id: "empire-grand-secretary-a", title: "内阁大学士甲", office: "内阁", description: "内阁大学士甲。独立审议需求，侧重方案完整性、长期维护与边界覆盖。", mode: "subagent", hidden: true, canEdit: false, defaultModel: DEFAULT_MODELS.strong },
  { id: "empire-grand-secretary-b", title: "内阁大学士乙", office: "内阁", description: "内阁大学士乙。独立审议需求，侧重实现可行性、交付成本与落地节奏。", mode: "subagent", hidden: true, canEdit: false, defaultModel: DEFAULT_MODELS.standard },
  { id: "empire-grand-secretary-c", title: "内阁大学士丙", office: "内阁", description: "内阁大学士丙。独立审议需求，侧重风险识别、失败路径与回滚准备。", mode: "subagent", hidden: true, canEdit: false, defaultModel: DEFAULT_MODELS.fast },
  { id: "empire-ministry-personnel", title: "吏部", office: "吏部", description: "吏部。将已批红票拟拆解为执行方案，明确任务分解、职责分配、验收标准与交接边界。", mode: "subagent", hidden: false, canEdit: false, defaultModel: DEFAULT_MODELS.standard },
  { id: "empire-ministry-revenue", title: "户部", office: "户部", description: "户部。负责代码探索、仓库舆图、文件定位、依赖关系与调用链分析，不做代码实现。", mode: "subagent", hidden: false, canEdit: false, defaultModel: DEFAULT_MODELS.fast },
  { id: "empire-ministry-rites", title: "礼部", office: "礼部", description: "礼部。负责规格审查、歧义发现、文案口吻、交互表达与文档一致性审核，审查不通过时封驳。", mode: "subagent", hidden: false, canEdit: false, defaultModel: DEFAULT_MODELS.standard },
  { id: "empire-ministry-war", title: "兵部", office: "兵部", description: "兵部。负责执行顺序编排、并发策略、失败重试与回滚方案设计。", mode: "subagent", hidden: false, canEdit: false, defaultModel: DEFAULT_MODELS.standard },
  { id: "empire-ministry-justice", title: "刑部", office: "刑部", description: "刑部。负责代码审查、测试把关、安全权限与风险审查，审查不通过时封驳。", mode: "subagent", hidden: false, canEdit: false, defaultModel: DEFAULT_MODELS.strong },
  { id: "empire-ministry-works", title: "工部", office: "工部", description: "工部。唯一有权直接实施代码改动的部门。负责代码实现、构建配置、类型修复与集成落地。", mode: "subagent", hidden: false, canEdit: true, defaultModel: DEFAULT_MODELS.strong },
];
