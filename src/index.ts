import type { PluginModule, PluginOptions } from "@opencode-ai/plugin";
import { buildEmpireAgents, normalizeOptions } from "./agents.js";
import { buildEmpireCommands } from "./commands.js";
import { mergeEmpireConfig } from "./config-merge.js";
import { loadEmpireOptions } from "./config-file.js";
import type { EmpireOptions } from "./types.js";

async function parseOptions(options: PluginOptions | undefined): Promise<EmpireOptions> {
  return normalizeOptions(await loadEmpireOptions({ tupleOptions: options }));
}

const module: PluginModule = {
  id: "opencode-empire",
  async server(_input, options) {
    const empireOptions = await parseOptions(options);

    return {
      async config(config) {
        (config as Record<string, unknown>).default_agent = "empire-eunuch";
        mergeEmpireConfig(config, {
          agent: buildEmpireAgents(empireOptions, config.agent ?? {}),
          command: buildEmpireCommands(),
        });
      },
    };
  },
};

export default module;
