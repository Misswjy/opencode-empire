import type { PluginModule, PluginOptions } from "@opencode-ai/plugin";
import { buildEmpireAgents, normalizeOptions } from "./agents.js";
import { buildEmpireCommands } from "./commands.js";
import { mergeEmpireConfig } from "./config-merge.js";
import type { EmpireOptions } from "./types.js";

function parseOptions(options: PluginOptions | undefined): EmpireOptions {
  const raw = (options ?? {}) as EmpireOptions;
  return normalizeOptions(raw);
}

const module: PluginModule = {
  id: "opencode-empire",
  async server(_input, options) {
    const empireOptions = parseOptions(options);

    return {
      async config(config) {
        mergeEmpireConfig(config, {
          agent: buildEmpireAgents(empireOptions),
          command: buildEmpireCommands(),
        });
      },
    };
  },
};

export default module;
