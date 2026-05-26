import { describe, expect, it } from "vitest";
import pluginModule from "../index.js";

function fakeInput() {
  return {};
}

describe("plugin module", () => {
  it("注册 cabinet、hidden grand secretary、works ministry 与票拟 command", async () => {
    const hooks = await pluginModule.server(fakeInput() as never, {
      models: { "empire-cabinet": "cockpit/gpt-5.4" },
    });

    const config: Record<string, unknown> = {};
    await hooks.config?.(config as never);

    const agents = (config.agent ?? {}) as Record<string, Record<string, unknown>>;
    const commands = (config.command ?? {}) as Record<string, Record<string, unknown>>;

    expect(agents["empire-cabinet"]?.model).toBe("cockpit/gpt-5.4");
    expect(agents["empire-grand-secretary-a"]?.hidden).toBe(true);
    expect(agents["empire-ministry-works"]?.hidden).toBe(false);
    expect(commands["票拟"]?.agent).toBe("empire-cabinet");
  });
});
