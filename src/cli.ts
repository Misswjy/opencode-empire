#!/usr/bin/env node
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { installEmpireConfig } from "./install.js";

function getVersion(): string {
  const pkgPath = fileURLToPath(new URL("../package.json", import.meta.url));
  return JSON.parse(readFileSync(pkgPath, "utf8")).version as string;
}

function isPermissionError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error.code === "EPERM" || error.code === "EACCES")
  );
}

interface CliDependencies {
  install: () => Promise<void>;
  log: (message: string) => void;
  error: (message: string) => void;
}

export async function runCli(args: string[], dependencies: CliDependencies): Promise<number> {
  const command = args[0];

  if (command === "--version" || command === "-v") {
    dependencies.log(getVersion());
    return 0;
  }

  if (command === "--help" || command === "-h") {
    dependencies.log("Usage: opencode-empire [install | --version | --help]");
    dependencies.log("");
    dependencies.log("Commands:");
    dependencies.log("  install   Install the opencode-empire plugin config");
    dependencies.log("  --version Print version");
    dependencies.log("  --help    Print this help message");
    return 0;
  }

  if (command !== "install") {
    dependencies.error("Usage: opencode-empire [install | --version | --help]");
    return 1;
  }

  try {
    await dependencies.install();
    dependencies.log("opencode-empire installed. Restart OpenCode to load the plugin.");
    return 0;
  } catch (error) {
    if (isPermissionError(error)) {
      dependencies.error(
        "Installation failed: permission denied when writing to ~/.config/opencode. " +
          "If you are running inside a sandboxed IDE, allow access to ~/.config/opencode and retry.",
      );
      return 1;
    }

    const message = error instanceof Error ? error.message : String(error);
    dependencies.error(`Installation failed: ${message}`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  process.exitCode = await runCli(process.argv.slice(2), {
    install: installEmpireConfig,
    log: console.error,
    error: console.error,
  });
}
