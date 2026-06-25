import { describe, expect, it } from "vitest";
import { runCli } from "../cli.js";

describe("runCli", () => {
  it("does not run the installer when the module is imported", () => {
    expect(process.exitCode).not.toBe(1);
  });

  it("prints version", async () => {
    const output: string[] = [];
    const exitCode = await runCli(["--version"], {
      install: async () => {},
      log: (message) => output.push(message),
      error: () => {},
    });

    expect(exitCode).toBe(0);
    expect(output).toEqual(["0.5.1"]);
  });

  it("prints help", async () => {
    const output: string[] = [];
    const exitCode = await runCli(["--help"], {
      install: async () => {},
      log: (message) => output.push(message),
      error: () => {},
    });

    expect(exitCode).toBe(0);
    expect(output[0]).toMatch(/Usage: opencode-empire/);
    expect(output.join("\n")).toContain("install");
  });

  it("prints usage for unknown commands", async () => {
    const errors: string[] = [];
    const exitCode = await runCli(["unknown"], {
      install: async () => {},
      log: () => {},
      error: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors).toEqual(["Usage: opencode-empire [install | --version | --help]"]);
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

  it("returns a sandbox hint for EPERM errors", async () => {
    const errors: string[] = [];
    const exitCode = await runCli(["install"], {
      install: async () => {
        const error = new Error("operation not permitted");
        (error as Error & { code: string }).code = "EPERM";
        throw error;
      },
      log: () => {},
      error: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors[0]).toMatch(/permission denied when writing to/);
    expect(errors[0]).toMatch(/sandboxed IDE/);
  });
});
