import { describe, expect, it } from "vitest";
import { buildEmpireAgents } from "../agents.js";
import * as generatedPrompts from "../prompts/generated.js";

describe("buildEmpireAgents", () => {
  it("registers cabinet as mode all, eunuch as primary, hidden grand secretaries, and visible ministries", () => {
    const agents = buildEmpireAgents({});

    expect(agents["empire-cabinet"]?.mode).toBe("all");
    expect(agents["empire-eunuch"]?.mode).toBe("primary");
    expect(agents["empire-grand-secretary-a"]?.hidden).toBe(true);
    expect(agents["empire-grand-secretary-b"]?.hidden).toBe(true);
    expect(agents["empire-grand-secretary-c"]?.hidden).toBe(true);
    expect(agents["empire-ministry-personnel"]?.hidden).toBe(false);
    expect(agents["empire-ministry-works"]?.hidden).toBe(false);
  });

  it("grants full permissions to all agents by default", () => {
    const agents = buildEmpireAgents({});

    expect(agents["empire-ministry-revenue"]?.permission).toEqual({
      "*": "allow",
    });
    expect(agents["empire-ministry-justice"]?.permission?.edit).toBeUndefined();
  });

  it("uses agent-scoped model overrides and disabled roles", () => {
    const agents = buildEmpireAgents({
      agents: {
        "empire-cabinet": {
          model: "cockpit/gpt-5.4",
        },
        "empire-ministry-works": {
          model: "cockpit/gpt-5.5",
        },
      },
      disabledRoles: ["empire-ministry-war"],
    });

    expect(agents["empire-cabinet"]?.model).toBe("cockpit/gpt-5.4");
    expect(agents["empire-ministry-works"]?.model).toBe("cockpit/gpt-5.5");
    expect(agents["empire-ministry-war"]).toBeUndefined();
  });

  it("ignores legacy model overrides", () => {
    const agents = buildEmpireAgents({
      models: {
        "empire-cabinet": "openai/gpt-5",
      },
    } as never);

    expect(agents["empire-cabinet"]?.model).toBe("cockpit/gpt-5.4");
  });

  it("passes agent-scoped options to generated agents", () => {
    const agents = buildEmpireAgents({
      agents: {
        "empire-cabinet": {
          options: { reasoningEffort: "high" },
        },
      },
    });

    expect(agents["empire-cabinet"]?.options).toEqual({ reasoningEffort: "high" });
  });

  it("shallow-merges agent-scoped permissions with defaults", () => {
    const agents = buildEmpireAgents({
      agents: {
        "empire-ministry-revenue": {
          permission: { webfetch: "allow" },
        },
      },
    });

    expect(agents["empire-ministry-revenue"]?.permission).toEqual({
      "*": "allow",
      webfetch: "allow",
    });
  });

  it("includes eunuch decree format and daily primary role", () => {
    const agents = buildEmpireAgents({});
    const prompt = agents["empire-eunuch"]?.prompt ?? "";

    expect(prompt).toContain("日常主对话入口");
    expect(prompt).toContain("【传旨】");
    expect(prompt).toContain("陛下有旨，令");
    expect(prompt).toContain("办毕复奏。");
    expect(prompt).toContain("低风险代码探索");
    expect(prompt).toContain("实际代码修改");
    expect(prompt).toContain("本轮目标");
    expect(prompt).toContain("完成定义");
    expect(prompt).toContain("【司礼监汇总复奏】");
    expect(prompt).toContain("汇总结论");
    expect(prompt).toContain("各部回奏摘要");
    expect(prompt).toContain("是否建议再交内阁复议");
    expect(prompt).toContain("复议理由");
    expect(prompt).toContain("建议下一步");
    expect(prompt).not.toContain("发部无需批红");
  });

  it("describes cabinet as dual-role agent with mode:all capabilities", () => {
    const agents = buildEmpireAgents({});
    const prompt = agents["empire-cabinet"]?.prompt ?? "";

    expect(prompt).toContain("内阁票拟");
    expect(prompt).toContain("作为子代理");
    expect(prompt).toContain("作为主代理");
    expect(prompt).toContain("可召大学士提供独立意见");
    expect(prompt).toContain("不越过司礼监直接调度六部");
    expect(prompt).toContain("证据不足");
    expect(prompt).toContain("先补调查");
    expect(prompt).toContain("四类主结论");
    expect(prompt).toContain("不得同时成立");
  });

  it("includes required cabinet forms and approval boundary", () => {
    const agents = buildEmpireAgents({});
    const prompt = agents["empire-cabinet"]?.prompt ?? "";

    expect(prompt).toContain("主代理回奏模板");
    expect(prompt).toContain("子代理回呈模板");
    expect(prompt).toContain("【内阁票拟】");
    expect(prompt).toContain("【六部派工单】");
    expect(prompt).toContain("【内阁复奏】");
    expect(prompt).toContain("决策摘要");
    expect(prompt).toContain("是否建议准行");
    expect(prompt).toContain("是否需先补调查");
    expect(prompt).toContain("待补调查事项");
    expect(prompt).toContain("调查完成前不得办理");
    expect(prompt).toContain("封驳理由");
    expect(prompt).toContain("暂缓条件");
    expect(prompt).toContain("分部策略");
    expect(prompt).toContain("分部派发提示");
    expect(prompt).toContain("吏部：交付目标、职责边界、验收标准");
    expect(prompt).toContain("户部：搜索范围、相关目录、依赖或调用链目标");
    expect(prompt).toContain("礼部：规格、文案、交互表达的审查范围");
    expect(prompt).toContain("兵部：执行顺序、并发关系、回滚条件");
    expect(prompt).toContain("刑部：审查范围、准行条件、必须验证项");
    expect(prompt).toContain("工部：改动范围、落地目标、验证要求、禁止顺手扩散");
    expect(prompt).toContain("当前结论");
    expect(prompt).toContain("关键证据");
    expect(prompt).toContain("风险与影响面");
    expect(prompt).toContain("没有用户批红，不得发部办理");
    expect(prompt).toContain("主要风险");
    expect(prompt).not.toContain("风险与封驳点");
  });

  it("honors disabled dispatch approval in the cabinet prompt", () => {
    const agents = buildEmpireAgents({ requireDispatchApproval: false });
    const prompt = agents["empire-cabinet"]?.prompt ?? "";

    expect(prompt).toContain("已批红票拟范围内，可以直接发部办理");
    expect(prompt).not.toContain("没有用户批红，不得发部办理");
  });

  it("keeps ministry prompts within department responsibility", () => {
    const agents = buildEmpireAgents({});

    expect(agents["empire-ministry-revenue"]?.prompt).toContain("代码探索");
    expect(agents["empire-ministry-works"]?.prompt).toContain("代码实现");
    expect(agents["empire-ministry-justice"]?.prompt).toContain("代码审查");
  });

  it("gives grand secretaries different review lenses", () => {
    const agents = buildEmpireAgents({});

    expect(agents["empire-grand-secretary-a"]?.prompt).toContain("你的判断");
    expect(agents["empire-grand-secretary-a"]?.prompt).toContain("长期维护");
    expect(agents["empire-grand-secretary-b"]?.prompt).toContain("交付成本");
    expect(agents["empire-grand-secretary-c"]?.prompt).toContain("失败路径");
    expect(agents["empire-grand-secretary-c"]?.prompt).toContain("与常规看法不同之处");
  });

  it("gives each ministry role-specific guardrails", () => {
    const agents = buildEmpireAgents({});

    expect(agents["empire-ministry-personnel"]?.prompt).toContain("【吏部拆解单】");
    expect(agents["empire-ministry-personnel"]?.prompt).toContain("验收标准");
    expect(agents["empire-ministry-personnel"]?.prompt).toContain("任务拆解");
    expect(agents["empire-ministry-personnel"]?.prompt).toContain("责任分配");
    expect(agents["empire-ministry-personnel"]?.prompt).toContain("前置依赖");
    expect(agents["empire-ministry-personnel"]?.prompt).toContain("建议执行顺序");
    expect(agents["empire-ministry-revenue"]?.prompt).toContain("【户部探索复奏】");
    expect(agents["empire-ministry-revenue"]?.prompt).toContain("不做实现");
    expect(agents["empire-ministry-revenue"]?.prompt).toContain("工程事实优先于角色化表达");
    expect(agents["empire-ministry-revenue"]?.prompt).toContain("调用链");
    expect(agents["empire-ministry-revenue"]?.prompt).toContain("当前观察结论");
    expect(agents["empire-ministry-revenue"]?.prompt).toContain("建议下一步调查");
    expect(agents["empire-ministry-rites"]?.prompt).toContain("【礼部审校复奏】");
    expect(agents["empire-ministry-rites"]?.prompt).toContain("规格结论");
    expect(agents["empire-ministry-rites"]?.prompt).toContain("歧义点");
    expect(agents["empire-ministry-rites"]?.prompt).toContain("一致性问题");
    expect(agents["empire-ministry-rites"]?.prompt).toContain("计划文档审查");
    expect(agents["empire-ministry-rites"]?.prompt).toContain("计划结构问题");
    expect(agents["empire-ministry-rites"]?.prompt).toContain("范围歧义");
    expect(agents["empire-ministry-rites"]?.prompt).toContain("表述不一致");
    expect(agents["empire-ministry-rites"]?.prompt).toContain("文案修订建议");
    expect(agents["empire-ministry-rites"]?.prompt).toContain("交互表达建议");
    expect(agents["empire-ministry-rites"]?.prompt).toContain("建议定稿项");
    expect(agents["empire-ministry-war"]?.prompt).toContain("【兵部编排复奏】");
    expect(agents["empire-ministry-war"]?.prompt).toContain("并发策略");
    expect(agents["empire-ministry-war"]?.prompt).toContain("回滚条件");
    expect(agents["empire-ministry-justice"]?.prompt).toContain("【刑部审覆】");
    expect(agents["empire-ministry-justice"]?.prompt).toContain("结论先于摘要");
    expect(agents["empire-ministry-justice"]?.prompt).toContain("问题严重性");
    expect(agents["empire-ministry-justice"]?.prompt).toContain("是否准行");
    expect(agents["empire-ministry-justice"]?.prompt).toContain("阻断问题");
    expect(agents["empire-ministry-justice"]?.prompt).toContain("重要问题");
    expect(agents["empire-ministry-justice"]?.prompt).toContain("一般问题");
    expect(agents["empire-ministry-justice"]?.prompt).toContain("建议处理顺序");
    expect(agents["empire-ministry-works"]?.prompt).toContain("【工部交付复奏】");
    expect(agents["empire-ministry-works"]?.prompt).toContain("唯一默认落地实施部门");
    expect(agents["empire-ministry-works"]?.prompt).toContain("改动文件");
    expect(agents["empire-ministry-works"]?.prompt).toContain("变更摘要");
    expect(agents["empire-ministry-works"]?.prompt).toContain("未覆盖场景");
  });

  it("exports only ministry-specific prompt constants", () => {
    expect(generatedPrompts).not.toHaveProperty("MINISTRY_PROMPT");
    expect(generatedPrompts).toHaveProperty("MINISTRY_PERSONNEL_PROMPT");
    expect(generatedPrompts).toHaveProperty("MINISTRY_REVENUE_PROMPT");
    expect(generatedPrompts).toHaveProperty("MINISTRY_RITES_PROMPT");
    expect(generatedPrompts).toHaveProperty("MINISTRY_WAR_PROMPT");
    expect(generatedPrompts).toHaveProperty("MINISTRY_JUSTICE_PROMPT");
    expect(generatedPrompts).toHaveProperty("MINISTRY_WORKS_PROMPT");
  });
});
