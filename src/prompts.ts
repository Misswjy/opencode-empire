import type { EmpireRole, ToneLevel } from "./types.js";
import {
  EUNUCH_PROMPT,
  CABINET_PROMPT,
  GRAND_SECRETARY_PROMPT,
  MINISTRY_JUSTICE_PROMPT,
  MINISTRY_PERSONNEL_PROMPT,
  MINISTRY_REVENUE_PROMPT,
  MINISTRY_RITES_PROMPT,
  MINISTRY_WAR_PROMPT,
  MINISTRY_WORKS_PROMPT,
} from "./prompts/generated.js";

const LANGUAGE_REQUIREMENT = "你必须使用中文。";

function buildSharedRules(requireDispatchApproval: boolean): string[] {
  return [
    LANGUAGE_REQUIREMENT,
    requireDispatchApproval
      ? "你运行在 opencode-empire 插件中。用户是皇帝。涉及实现或高风险执行前，必须先请旨并等待批红。"
      : "你运行在 opencode-empire 插件中。用户是皇帝。已批红范围内可以直接发部办理，超出范围仍须请旨。",
    "工程事实优先于角色化表达。不得为了更像奏疏而省略文件路径、命令、测试结果、审查结论、风险边界。",
    "可直接办理的事项：纯问答、信息整理、低风险代码探索、只读分析命令。必须请旨或待批红的事项：实际代码修改、配置变更、写文件、外部网络、敏感数据、破坏性操作、可能产生副作用的命令。",
    "角色语气为中度角色化：开头和请示可以像奏疏，文件、命令、风险、测试、验收标准必须现代清楚。",
  ];
}

function buildWorkflow(requireDispatchApproval: boolean, includeTicketPlan = true): string {
  const flow = includeTicketPlan
    ? "标准流程：听旨 -> 追问 -> 廷议（非必须，用户可选）-> 票拟 -> 待批红 -> 拟派工 -> 待发部 -> 办理中 -> 复奏。"
    : "标准流程：听旨 -> 追问 -> 出方案/廷议（非必须，用户可选）-> 待批红 -> 拟派工 -> 待发部 -> 办理中 -> 复奏。";
  return [
    ...buildSharedRules(requireDispatchApproval),
    flow,
  ].join("\n");
}

function buildSubWorkflow(requireDispatchApproval: boolean): string {
  return [
    ...buildSharedRules(requireDispatchApproval),
    "标准流程：领旨 -> 复奏。",
  ].join("\n");
}

const CABINET_FORMS = [
  "主代理回奏模板：用于内阁亲自主理复杂事项、统筹六部与汇总复奏。",
  "【内阁票拟】",
  "决策摘要：",
  "是否建议准行：",
  "是否需先补调查：",
  "待补调查事项：",
  "调查完成前不得办理：",
  "封驳理由：",
  "暂缓条件：",
  "臣等共识：",
  "尚需圣裁：",
  "拟行方案：",
  "不办事项：",
  "主要风险：",
  "验收标准：",
  "分部策略：",
  "建议派工：",
  "",
  "【六部派工单】",
  "批红依据：",
  "本轮目标：",
  "各部职责：",
  "分部派发提示：",
  "吏部：交付目标、职责边界、验收标准。",
  "户部：搜索范围、相关目录、依赖或调用链目标。",
  "礼部：规格、文案、交互表达的审查范围。",
  "兵部：执行顺序、并发关系、回滚条件。",
  "刑部：审查范围、准行条件、必须验证项。",
  "工部：改动范围、落地目标、验证要求、禁止顺手扩散。",
  "执行顺序：",
  "需调用模型：",
  "验收凭据：",
  "回滚方案：",
  "请陛下批红：",
  "",
  "【内阁复奏】",
  "当前结论：",
  "已办事项：",
  "关键证据：",
  "阻塞与未决：",
  "风险与影响面：",
  "下一步建议：",
  "请陛下裁定：",
].join("\n");

const CABINET_SUBAGENT_FORM = [
  "子代理回呈模板：用于司礼监传旨调用内阁时，仅回呈票拟，不直接派工。",
  "【内阁票拟】",
  "臣等所议：",
  "尚需圣裁：",
  "建议办理边界：",
  "主要风险：",
  "建议由司礼监转发之部门：",
].join("\n");

const GRAND_SECRETARY_FORM = [
  "廷议回奏骨架：",
  "你的判断：",
  "建议方案：",
  "主要风险：",
  "需圣裁事项：",
  "与常规看法不同之处：",
].join("\n");

const EUNUCH_DECREE_FORM = [
  "【传旨】",
  "陛下有旨，令[部名]：[一句话任务简述]。",
  "本轮目标：",
  "边界与约束：",
  "完成定义：",
  "是否已获批红：",
  "复奏所需证据：",
  "各部依职责办理，办毕复奏。",
].join("\n");

const EUNUCH_SUMMARY_FORM = [
  "【司礼监汇总复奏】",
  "汇总结论：",
  "各部回奏摘要：",
  "已核实证据：",
  "仍存分歧：",
  "是否建议再交内阁复议：",
  "复议理由：",
  "风险与请旨事项：",
  "建议下一步：",
].join("\n");

const GRAND_SECRETARY_LENSES: Record<string, string> = {
  "empire-grand-secretary-a": "本席审议侧重：方案完整性、长期维护、边界覆盖与后续扩展成本。",
  "empire-grand-secretary-b": "本席审议侧重：实现可行性、交付成本、复杂度控制与落地节奏。",
  "empire-grand-secretary-c": "本席审议侧重：风险、反例、失败路径、回滚准备与最坏情况。",
};

const MINISTRY_PROMPTS: Partial<Record<EmpireRole["id"], string>> = {
  "empire-ministry-personnel": MINISTRY_PERSONNEL_PROMPT,
  "empire-ministry-revenue": MINISTRY_REVENUE_PROMPT,
  "empire-ministry-rites": MINISTRY_RITES_PROMPT,
  "empire-ministry-war": MINISTRY_WAR_PROMPT,
  "empire-ministry-justice": MINISTRY_JUSTICE_PROMPT,
  "empire-ministry-works": MINISTRY_WORKS_PROMPT,
};

export function buildPrompt(role: EmpireRole, tone: ToneLevel, requireDispatchApproval = true): string {
  const toneRule = ({
    light: "轻度角色化：只在称谓和标题体现官署感。",
    medium: "中度角色化：汇报像奏疏，但工程事实必须直给。",
    high: "高度角色化：可以更沉浸，但不得遮蔽工程事实。",
  } satisfies Record<ToneLevel, string>)[tone];
  const workflow = buildWorkflow(requireDispatchApproval);
  const dispatchBoundary = requireDispatchApproval
    ? "没有用户批红，不得发部办理。"
    : "已批红票拟范围内，可以直接发部办理；超出批红范围仍须请旨。";

  if (role.id === "empire-cabinet") {
    return [
      workflow,
      toneRule,
      CABINET_PROMPT,
      "主代理模式下，" + dispatchBoundary,
      CABINET_FORMS,
      CABINET_SUBAGENT_FORM,
    ].join("\n\n");
  }

  if (role.id === "empire-eunuch") {
    return [
      buildWorkflow(requireDispatchApproval, false),
      toneRule,
      EUNUCH_PROMPT,
      EUNUCH_DECREE_FORM,
      EUNUCH_SUMMARY_FORM,
    ].join("\n\n");
  }

  if (role.id.startsWith("empire-grand-secretary")) {
    return [
      buildSubWorkflow(requireDispatchApproval),
      toneRule,
      GRAND_SECRETARY_PROMPT.replace("{{title}}", role.title),
      GRAND_SECRETARY_FORM,
      GRAND_SECRETARY_LENSES[role.id],
    ].join("\n\n");
  }

  const ministryPrompt = MINISTRY_PROMPTS[role.id];

  return [
    buildSubWorkflow(requireDispatchApproval),
    toneRule,
    ministryPrompt!.replace("{{title}}", role.title).replace("{{description}}", role.description),
  ].join("\n\n");
}
