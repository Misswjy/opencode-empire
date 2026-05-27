import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { installEmpireConfig } from "../install.js";

let tempHome: string | undefined;

async function makeHome(): Promise<string> {
  tempHome = join(tmpdir(), `opencode-empire-install-${process.pid}-${Date.now()}`);
  await mkdir(join(tempHome, ".config", "opencode"), { recursive: true });
  return tempHome;
}

afterEach(async () => {
  if (tempHome) {
    await rm(tempHome, { recursive: true, force: true });
    tempHome = undefined;
  }
});

describe("installEmpireConfig", () => {
  it("creates dedicated plugin config and enables the plugin", async () => {
    const home = await makeHome();

    await installEmpireConfig({ home });

    const empireConfig = JSON.parse(
      await readFile(join(home, ".config", "opencode", "opencode-empire.json"), "utf8"),
    );
    const opencodeConfig = JSON.parse(await readFile(join(home, ".config", "opencode", "opencode.json"), "utf8"));

    expect(empireConfig.$schema).toBe("https://unpkg.com/opencode-empire@latest/opencode-empire.schema.json");
    expect(empireConfig.tone).toBe("medium");
    expect(empireConfig.models).toBeUndefined();
    expect(empireConfig.agents["empire-cabinet"].model).toBe("cockpit/gpt-5.4");
    expect(opencodeConfig.plugin).toContain("opencode-empire");
  });

  it("does not overwrite an existing dedicated plugin config", async () => {
    const home = await makeHome();
    const empirePath = join(home, ".config", "opencode", "opencode-empire.json");
    await writeFile(empirePath, JSON.stringify({ tone: "high" }, null, 2));

    await installEmpireConfig({ home });

    expect(JSON.parse(await readFile(empirePath, "utf8"))).toEqual({ tone: "high" });
  });

  it("preserves existing opencode config fields and plugin entries", async () => {
    const home = await makeHome();
    const opencodePath = join(home, ".config", "opencode", "opencode.json");
    await writeFile(
      opencodePath,
      JSON.stringify({ model: "openai/gpt-5", plugin: ["existing-plugin"] }, null, 2),
    );

    await installEmpireConfig({ home });

    expect(JSON.parse(await readFile(opencodePath, "utf8"))).toMatchObject({
      model: "openai/gpt-5",
      plugin: ["existing-plugin", "opencode-empire"],
    });
  });

  it("does not duplicate an existing tuple plugin entry", async () => {
    const home = await makeHome();
    const opencodePath = join(home, ".config", "opencode", "opencode.json");
    await writeFile(
      opencodePath,
      JSON.stringify({ plugin: [["opencode-empire", { tone: "high" }]] }, null, 2),
    );

    await installEmpireConfig({ home });

    expect(JSON.parse(await readFile(opencodePath, "utf8"))).toMatchObject({
      plugin: [["opencode-empire", { tone: "high" }]],
    });
  });
});
