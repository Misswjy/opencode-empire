import { describe, expect, it } from "vitest";
import { buildEmpireCommands } from "../commands.js";

describe("buildEmpireCommands", () => {
  it("registers all imperial workflow commands", () => {
    const commands = buildEmpireCommands();

    expect(Object.keys(commands).sort()).toEqual([
      "发部",
      "复奏",
      "廷议",
      "批红",
      "票拟",
      "驳回",
    ]);
  });

  it("routes commands to the cabinet", () => {
    const commands = buildEmpireCommands();

    expect(commands["票拟"]?.agent).toBe("empire-cabinet");
    expect(commands["发部"]?.agent).toBe("empire-cabinet");
    expect(commands["复奏"]?.agent).toBe("empire-cabinet");
  });

  it("uses command templates that preserve user arguments", () => {
    const commands = buildEmpireCommands();

    expect(commands["驳回"]?.template).toContain("$ARGUMENTS");
    expect(commands["批红"]?.template).toContain("$ARGUMENTS");
  });
});
