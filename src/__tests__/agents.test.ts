import { describe, expect, it } from "vitest";
import { buildEmpireAgents } from "../agents.js";

describe("buildEmpireAgents", () => {
  it("registers cabinet, hidden grand secretaries, and visible ministries", () => {
    const agents = buildEmpireAgents({});

    expect(agents["empire-cabinet"]?.mode).toBe("primary");
    expect(agents["empire-grand-secretary-a"]?.hidden).toBe(true);
    expect(agents["empire-grand-secretary-b"]?.hidden).toBe(true);
    expect(agents["empire-grand-secretary-c"]?.hidden).toBe(true);
    expect(agents["empire-ministry-personnel"]?.hidden).toBe(false);
    expect(agents["empire-ministry-works"]?.hidden).toBe(false);
  });

  it("assigns read-only permissions to exploration and review roles", () => {
    const agents = buildEmpireAgents({});

    expect(agents["empire-ministry-revenue"]?.permission).toEqual({
      edit: "deny",
      bash: "ask",
      webfetch: "ask",
      external_directory: "ask",
    });
    expect(agents["empire-ministry-justice"]?.permission?.edit).toBe("deny");
  });

  it("allows the works ministry to edit with approval", () => {
    const agents = buildEmpireAgents({});

    expect(agents["empire-ministry-works"]?.permission?.edit).toBe("ask");
  });

  it("uses model overrides and disabled roles", () => {
    const agents = buildEmpireAgents({
      models: {
        "empire-cabinet": "cockpit/gpt-5.4",
        "empire-ministry-works": "cockpit/gpt-5.5",
      },
      disabledRoles: ["empire-ministry-war"],
    });

    expect(agents["empire-cabinet"]?.model).toBe("cockpit/gpt-5.4");
    expect(agents["empire-ministry-works"]?.model).toBe("cockpit/gpt-5.5");
    expect(agents["empire-ministry-war"]).toBeUndefined();
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
