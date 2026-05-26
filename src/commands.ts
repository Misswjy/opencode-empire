import type { Config } from "@opencode-ai/plugin";

type CommandConfig = NonNullable<Config["command"]>;

const CABINET_AGENT = "empire-cabinet";
const EUNUCH_AGENT = "empire-eunuch";

export function buildEmpireCommands(): CommandConfig {
  return {
    票拟: {
      description: "强制进入内阁需求澄清与票拟流程",
      agent: CABINET_AGENT,
      template: "请以内阁身份对以下旨意进入票拟流程。若需求不清，一次只追问一个关键问题。\n\n$ARGUMENTS",
    },
    廷议: {
      description: "请三位内阁大学士独立审议当前事项",
      agent: CABINET_AGENT,
      template: "请召三位隐藏内阁大学士独立廷议，并按共识优先格式呈报。\n\n$ARGUMENTS",
    },
    批红: {
      description: "确认某版票拟或派工单",
      agent: CABINET_AGENT,
      template: "朕批红如下。请内阁据此进入下一阶段，不得超出批红范围。\n\n$ARGUMENTS",
    },
    驳回: {
      description: "驳回当前票拟、派工单或办理结果",
      agent: CABINET_AGENT,
      template: "朕驳回如下。请内阁说明需重拟之处，并重新呈报。\n\n$ARGUMENTS",
    },
    发部: {
      description: "根据已批票拟生成六部派工建议",
      agent: CABINET_AGENT,
      template: "请内阁根据已批红内容生成【六部派工单】，等待朕再次确认后再办理。\n\n$ARGUMENTS",
    },
    复奏: {
      description: "汇总当前办理结果、证据、风险和待裁定事项",
      agent: CABINET_AGENT,
      template: "请内阁按【内阁复奏】格式汇总当前办理情况。\n\n$ARGUMENTS",
    },
    传旨: {
      description: "司礼监传旨办差，直接向六部发单",
      agent: EUNUCH_AGENT,
      template: "传旨如下，请司礼监择部发单办理，办毕复奏。\n\n$ARGUMENTS",
    },
  };
}
