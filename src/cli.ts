#!/usr/bin/env node
import { installEmpireConfig } from "./install.js";

const command = process.argv[2];

if (command !== "install") {
  console.error("Usage: opencode-empire install");
  process.exitCode = 1;
} else {
  await installEmpireConfig();
  console.log("opencode-empire installed. Restart OpenCode to load the plugin.");
}
