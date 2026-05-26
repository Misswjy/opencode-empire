import { describe, expect, it } from "vitest";
import { runCli } from "../cli.js";

describe("runCli", () => {
  it("does not run the installer when the module is imported", () => {
    expect(process.exitCode).not.toBe(1);
  });

  it("prints usage for unknown commands", async () => {
    const errors: string[] = [];
    const exitCode = await runCli(["unknown"], {
      install: async () => {},
      log: () => {},
      error: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors).toEqual(["Usage: opencode-empire install"]);
  });

  it("returns non-zero exit code and clear message when install fails", async () => {
    const errors: string[] = [];
    const exitCode = await runCli(["install"], {
      install: async () => {
        throw new Error("permission denied");
      },
      log: () => {},
      error: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors).toEqual(["Installation failed: permission denied"]);
  });
});
