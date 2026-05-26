import { describe, expect, it } from "vitest";
import { mergeEmpireConfig } from "../config-merge.js";

describe("mergeEmpireConfig", () => {
  it("保留 existing agents/commands 并合并 empire patch", () => {
    const config = {
      agent: {
        existing: {
          description: "existing agent",
        },
      },
      command: {
        existing: {
          description: "existing command",
        },
      },
    };

    mergeEmpireConfig(config as never, {
      agent: {
        "empire-cabinet": {
          description: "cabinet",
        },
      },
      command: {
        票拟: {
          description: "ticket",
        },
      },
    } as never);

    expect(config.agent).toMatchObject({
      existing: {
        description: "existing agent",
      },
      "empire-cabinet": {
        description: "cabinet",
      },
    });
    expect(config.command).toMatchObject({
      existing: {
        description: "existing command",
      },
      票拟: {
        description: "ticket",
      },
    });
  });
});
