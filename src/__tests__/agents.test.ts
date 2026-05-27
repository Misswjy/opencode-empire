import { describe, expect, it } from "vitest";
import { buildEmpireAgents } from "../agents.js";

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
      edit: "allow",
      bash: "allow",
      webfetch: "allow",
      external_directory: "allow",
    });
    expect(agents["empire-ministry-justice"]?.permission?.edit).toBe("allow");
    expect(agents["empire-ministry-works"]?.permission?.edit).toBe("allow");
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
      edit: "allow",
      bash: "allow",
      webfetch: "allow",
      external_directory: "allow",
    });
  });

  it("includes eunuch decree format and daily primary role", () => {
    const agents = buildEmpireAgents({});
    const prompt = agents["empire-eunuch"]?.prompt ?? "";

    expect(prompt).toContain("日常主对话入口");
    expect(prompt).toContain("【传旨】");
    expect(prompt).toContain("着令：");
    expect(prompt).toContain("办毕复奏。");
    expect(prompt).toContain("发部无需批红");
  });

  it("describes cabinet as dual-role agent with mode:all capabilities", () => {
    const agents = buildEmpireAgents({});
    const prompt = agents["empire-cabinet"]?.prompt ?? "";

    expect(prompt).toContain("内阁票拟");
    expect(prompt).toContain("作为子代理");
    expect(prompt).toContain("作为主代理");
  });

  it("includes required cabinet forms and approval boundary", () => {
    const agents = buildEmpireAgents({});
    const prompt = agents["empire-cabinet"]?.prompt ?? "";

    expect(prompt).toContain("【内阁票拟】");
    expect(prompt).toContain("【六部派工单】");
    expect(prompt).toContain("【内阁复奏】");
    expect(prompt).toContain("没有用户批红，不得发部办理");
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
});
