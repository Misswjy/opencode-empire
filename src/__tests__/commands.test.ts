import { describe, expect, it } from "vitest";
import { buildEmpireCommands } from "../commands.js";

describe("buildEmpireCommands", () => {
  it("registers only the court deliberation command", () => {
    const commands = buildEmpireCommands();

    expect(Object.keys(commands)).toEqual(["廷议"]);
  });

  it("routes court deliberation to the cabinet", () => {
    const commands = buildEmpireCommands();

    expect(commands["廷议"]?.agent).toBe("empire-cabinet");
  });

  it("uses a court deliberation template that preserves user arguments", () => {
    const commands = buildEmpireCommands();

    expect(commands["廷议"]?.template).toContain("三位隐藏内阁大学士");
    expect(commands["廷议"]?.template).toContain("$ARGUMENTS");
  });
});
