import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { getEmpireConfigPath, getOpencodeConfigDir } from "./config-file.js";

interface InstallOptions {
  home?: string;
}

interface OpenCodeConfig {
  $schema?: string;
  plugin?: Array<string | [string, Record<string, unknown>]>;
  [key: string]: unknown;
}

const DEFAULT_EMPIRE_CONFIG = {
  $schema: "https://unpkg.com/opencode-empire@latest/opencode-empire.schema.json",
  tone: "medium",
  requireDispatchApproval: true,
  agents: {
    "empire-cabinet": { model: "cockpit/gpt-5.4", permission: { edit: "deny", bash: "ask" } },
    "empire-eunuch": { model: "cockpit/gpt-5.4", permission: { edit: "deny", bash: "ask" } },
    "empire-grand-secretary-a": { model: "cockpit/gpt-5.5", permission: { edit: "deny", bash: "ask" } },
    "empire-grand-secretary-b": { model: "cockpit/gpt-5.4", permission: { edit: "deny", bash: "ask" } },
    "empire-grand-secretary-c": { model: "opencode-go/deepseek-v4-flash", permission: { edit: "deny", bash: "ask" } },
    "empire-ministry-personnel": { model: "cockpit/gpt-5.4", permission: { edit: "deny", bash: "ask" } },
    "empire-ministry-revenue": { model: "opencode-go/deepseek-v4-flash", permission: { edit: "deny", bash: "ask" } },
    "empire-ministry-rites": { model: "cockpit/gpt-5.4", permission: { edit: "deny", bash: "ask" } },
    "empire-ministry-war": { model: "cockpit/gpt-5.4", permission: { edit: "deny", bash: "ask" } },
    "empire-ministry-justice": { model: "cockpit/gpt-5.5", permission: { edit: "deny", bash: "ask" } },
    "empire-ministry-works": { model: "cockpit/gpt-5.5", permission: { edit: "ask" } },
  },
  disabledRoles: [],
};

function parseJsonc(raw: string): unknown {
  const withoutComments = raw.replace(/\/\*[\s\S]*?\*\/|(^|[^:])\/\/.*$/gm, "$1");
  return JSON.parse(withoutComments.replace(/,\s*([}\]])/g, "$1"));
}

async function readJsonIfExists<T>(path: string, fallback: T): Promise<T> {
  try {
    return parseJsonc(await readFile(path, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return fallback;
    }
    throw error;
  }
}

function hasEmpirePlugin(plugin: OpenCodeConfig["plugin"]): boolean {
  return (plugin ?? []).some((entry) => entry === "opencode-empire" || (Array.isArray(entry) && entry[0] === "opencode-empire"));
}

export async function installEmpireConfig(options: InstallOptions = {}): Promise<void> {
  const home = options.home ?? homedir();
  const configDir = getOpencodeConfigDir(home);
  const empirePath = getEmpireConfigPath(home);
  const opencodePath = join(configDir, "opencode.json");

  await mkdir(configDir, { recursive: true });

  try {
    await readFile(empirePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
    await writeFile(empirePath, `${JSON.stringify(DEFAULT_EMPIRE_CONFIG, null, 2)}\n`);
  }

  const opencodeConfig = await readJsonIfExists<OpenCodeConfig>(opencodePath, {
    $schema: "https://opencode.ai/config.json",
  });
  const plugin = opencodeConfig.plugin ?? [];

  if (!hasEmpirePlugin(plugin)) {
    opencodeConfig.plugin = [...plugin, "opencode-empire"];
  }

  opencodeConfig.$schema ??= "https://opencode.ai/config.json";
  await writeFile(opencodePath, `${JSON.stringify(opencodeConfig, null, 2)}\n`);
}
