import type { EmpireRole, ToneLevel } from "./types.js";
import { EUNUCH_PROMPT, CABINET_PROMPT, GRAND_SECRETARY_PROMPT, MINISTRY_PROMPT } from "./prompts/generated.js";

const LANGUAGE_REQUIREMENT = "你必须使用中文。";

function buildWorkflow(requireDispatchApproval: boolean): string {
  return [
    LANGUAGE_REQUIREMENT,
    requireDispatchApproval
      ? "你运行在 opencode-empire 插件中。用户是皇帝，重要执行前必须等待批红。"
      : "你运行在 opencode-empire 插件中。用户是皇帝，已批红票拟范围内，可以直接发部办理。",
    "标准流程：听旨 -> 追问 -> 廷议 -> 票拟 -> 待批红 -> 拟派工 -> 待发部 -> 办理中 -> 复奏。",
    "角色语气为中度角色化：开头和请示可以像奏疏，文件、命令、风险、测试、验收标准必须现代清楚。",
  ].join("\n");
}

const CABINET_FORMS = [
  "【内阁票拟】",
  "臣等共识：",
  "尚需圣裁：",
  "拟行方案：",
  "不办事项：",
  "风险与封驳点：",
  "验收标准：",
  "建议派工：",
  "",
  "【六部派工单】",
  "批红依据：",
  "本轮目标：",
  "各部职责：",
  "执行顺序：",
  "需调用模型：",
  "验收凭据：",
  "回滚方案：",
  "请陛下批红：",
  "",
  "【内阁复奏】",
  "已办：",
  "证据：",
  "未决：",
  "风险：",
  "请陛下裁定：",
].join("\n");

const MINISTRY_FORM = [
  "【本部复奏】",
  "臣等所办：",
  "证据：",
  "所遇风险：",
  "请陛下裁定：",
].join("\n");

const EUNUCH_DECREE = [
  "【传旨】",
  "陛下有旨，令[部名]：[一句话任务简述]。",
  "[自由展开具体事项、约束、输出要求等]",
  "各部依职责办理，办毕复奏。",
].join("\n");

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
    ].join("\n\n");
  }

  if (role.id === "empire-eunuch") {
    return [
      LANGUAGE_REQUIREMENT,
      toneRule,
      EUNUCH_PROMPT,
      EUNUCH_DECREE,
      MINISTRY_FORM,
    ].join("\n\n");
  }

  if (role.id.startsWith("empire-grand-secretary")) {
    return [
      workflow,
      toneRule,
      GRAND_SECRETARY_PROMPT.replace("{{title}}", role.title),
    ].join("\n\n");
  }

  return [
    workflow,
    toneRule,
    MINISTRY_PROMPT.replace("{{title}}", role.title).replace("{{description}}", role.description),
    MINISTRY_FORM,
  ].join("\n\n");
}
