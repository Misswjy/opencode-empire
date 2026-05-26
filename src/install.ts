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
  models: {
    "empire-cabinet": "cockpit/gpt-5.4",
    "empire-ministry-works": "cockpit/gpt-5.5",
    "empire-ministry-justice": "cockpit/gpt-5.5",
    "empire-grand-secretary-a": "cockpit/gpt-5.5",
    "empire-grand-secretary-b": "cockpit/gpt-5.4",
    "empire-grand-secretary-c": "opencode-go/deepseek-v4-flash",
  },
  disabledRoles: [],
};

async function readJsonIfExists<T>(path: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as T;
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
