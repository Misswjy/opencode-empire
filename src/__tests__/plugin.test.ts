import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { getEmpireConfigPath } from "../config-file.js";
import pluginModule from "../index.js";

const originalHome = process.env.HOME;
let tempHome: string | undefined;

async function useTempHome(): Promise<string> {
  tempHome = join(tmpdir(), `opencode-empire-plugin-${process.pid}-${Date.now()}`);
  await mkdir(join(tempHome, ".config", "opencode"), { recursive: true });
  process.env.HOME = tempHome;
  return tempHome;
}

afterEach(async () => {
  process.env.HOME = originalHome;
  if (tempHome) {
    await rm(tempHome, { recursive: true, force: true });
    tempHome = undefined;
  }
});

function fakeInput() {
  return {};
}

describe("plugin module", () => {
  it("注册 cabinet（mode:all）、hidden grand secretary、works ministry 与廷议 command，设 default_agent 为司礼监", async () => {
    const hooks = await pluginModule.server(fakeInput() as never, {
      agents: { "empire-cabinet": { model: "cockpit/gpt-5.4" } },
    });

    const config: Record<string, unknown> = {};
    await hooks.config?.(config as never);

    const agents = (config.agent ?? {}) as Record<string, Record<string, unknown>>;
    const commands = (config.command ?? {}) as Record<string, Record<string, unknown>>;

    expect(config.default_agent).toBe("empire-eunuch");
    expect(agents["empire-cabinet"]?.model).toBe("cockpit/gpt-5.4");
    expect(agents["empire-cabinet"]?.mode).toBe("all");
    expect(agents["empire-grand-secretary-a"]?.hidden).toBe(true);
    expect(agents["empire-ministry-works"]?.hidden).toBe(false);
    expect(Object.keys(commands)).toEqual(["廷议"]);
    expect(commands["廷议"]?.agent).toBe("empire-cabinet");
  });

  it("读取专属配置文件，并允许 tuple options 覆盖", async () => {
    const home = await useTempHome();
    await writeFile(
      getEmpireConfigPath(home),
      JSON.stringify({
        tone: "light",
        agents: { "empire-cabinet": { model: "openai/gpt-5" } },
      }),
    );

    const hooks = await pluginModule.server(fakeInput() as never, {
      tone: "high",
    });
    const config: Record<string, unknown> = {};

    await hooks.config?.(config as never);

    const agents = (config.agent ?? {}) as Record<string, Record<string, unknown>>;
    expect(agents["empire-cabinet"]?.model).toBe("openai/gpt-5");
    expect(agents["empire-cabinet"]?.prompt).toContain("高度角色化");
  });
});
