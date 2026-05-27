#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { installEmpireConfig } from "./install.js";

interface CliDependencies {
  install: () => Promise<void>;
  log: (message: string) => void;
  error: (message: string) => void;
}

export async function runCli(args: string[], dependencies: CliDependencies): Promise<number> {
  const command = args[0];

  if (command !== "install") {
    dependencies.error("Usage: opencode-empire install");
    return 1;
  }

  try {
    await dependencies.install();
    dependencies.log("opencode-empire installed. Restart OpenCode to load the plugin.");
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    dependencies.error(`Installation failed: ${message}`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await runCli(process.argv.slice(2), {
    install: installEmpireConfig,
    log: console.error,
    error: console.error,
  });
}
