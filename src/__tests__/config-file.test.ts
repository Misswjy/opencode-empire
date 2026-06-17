import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { getEmpireConfigPath, loadEmpireOptions } from "../config-file.js";

let tempHome: string | undefined;

async function makeHome(): Promise<string> {
  tempHome = join(tmpdir(), `opencode-empire-${process.pid}-${Date.now()}`);
  await mkdir(join(tempHome, ".config", "opencode"), { recursive: true });
  return tempHome;
}

afterEach(async () => {
  if (tempHome) {
    await rm(tempHome, { recursive: true, force: true });
    tempHome = undefined;
  }
});

describe("loadEmpireOptions", () => {
  it("returns tuple options when the dedicated config file does not exist", async () => {
    const home = await makeHome();

    await expect(loadEmpireOptions({ home, tupleOptions: { tone: "high" } })).resolves.toMatchObject({
      tone: "high",
    });
  });

  it("loads the dedicated opencode-empire config file", async () => {
    const home = await makeHome();
    await writeFile(
      getEmpireConfigPath(home),
      JSON.stringify({ tone: "light", agents: { "empire-cabinet": { model: "openai/gpt-5" } } }),
    );

    await expect(loadEmpireOptions({ home, tupleOptions: {} })).resolves.toMatchObject({
      tone: "light",
      agents: { "empire-cabinet": { model: "openai/gpt-5" } },
    });
  });

  it("drops legacy models from loaded config", async () => {
    const home = await makeHome();
    await writeFile(
      getEmpireConfigPath(home),
      JSON.stringify({ tone: "light", models: { "empire-cabinet": "openai/gpt-5" } }),
    );

    await expect(loadEmpireOptions({ home, tupleOptions: {} })).resolves.not.toHaveProperty("models");
  });

  it("lets tuple options override the dedicated config file", async () => {
    const home = await makeHome();
    await writeFile(
      getEmpireConfigPath(home),
      JSON.stringify({ tone: "light", requireDispatchApproval: true }),
    );

    await expect(
      loadEmpireOptions({ home, tupleOptions: { tone: "high", requireDispatchApproval: false } }),
    ).resolves.toMatchObject({
      tone: "high",
      requireDispatchApproval: false,
    });
  });

  it("merges file and tuple agent-scoped model and permission config per agent", async () => {
    const home = await makeHome();
    await writeFile(
      getEmpireConfigPath(home),
      JSON.stringify({
        agents: {
          "empire-cabinet": {
            model: "cockpit/gpt-5.4",
            permission: { bash: "ask", edit: "deny" },
          },
        },
      }),
    );

    await expect(
      loadEmpireOptions({
        home,
        tupleOptions: {
          agents: {
            "empire-cabinet": {
              model: "cockpit/gpt-5.5",
              permission: { webfetch: "allow" },
            },
          },
        },
      }),
    ).resolves.toMatchObject({
      agents: {
        "empire-cabinet": {
          model: "cockpit/gpt-5.5",
          permission: { bash: "ask", edit: "deny", webfetch: "allow" },
        },
      },
    });
  });

  it("deep-merges nested permission rules per agent", async () => {
    const home = await makeHome();
    await writeFile(
      getEmpireConfigPath(home),
      JSON.stringify({
        agents: {
          "empire-cabinet": {
            permission: { bash: { "*": "ask", "rm -rf *": "deny" }, edit: "deny" },
          },
        },
      }),
    );

    await expect(
      loadEmpireOptions({
        home,
        tupleOptions: {
          agents: {
            "empire-cabinet": {
              permission: { bash: { "npm test": "allow" }, webfetch: "allow" },
            },
          },
        },
      }),
    ).resolves.toMatchObject({
      agents: {
        "empire-cabinet": {
          permission: {
            bash: { "*": "ask", "rm -rf *": "deny", "npm test": "allow" },
            edit: "deny",
            webfetch: "allow",
          },
        },
      },
    });
  });

  it("throws a clear error for invalid JSON", async () => {
    const home = await makeHome();
    await writeFile(getEmpireConfigPath(home), "{");

    await expect(loadEmpireOptions({ home, tupleOptions: {} })).rejects.toThrow(
      "Failed to parse opencode-empire config",
    );
  });

  it("rejects disabling required roles", async () => {
    const home = await makeHome();
    await writeFile(getEmpireConfigPath(home), JSON.stringify({ disabledRoles: ["empire-eunuch"] }));

    await expect(loadEmpireOptions({ home, tupleOptions: {} })).rejects.toThrow(
      "Cannot disable required opencode-empire role: empire-eunuch",
    );
  });

  it("rejects disabling required roles from tuple options", async () => {
    const home = await makeHome();

    await expect(loadEmpireOptions({ home, tupleOptions: { disabledRoles: ["empire-cabinet"] } })).rejects.toThrow(
      "Cannot disable required opencode-empire role: empire-cabinet",
    );
  });
});
