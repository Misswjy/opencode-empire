import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { PluginOptions } from "@opencode-ai/plugin";
import type { AgentOptionsMap, EmpireAgentOptions, EmpireOptions, EmpireRoleId } from "./types.js";

export interface LoadEmpireOptionsInput {
  home?: string;
  tupleOptions?: PluginOptions;
}

export function getOpencodeConfigDir(home = homedir()): string {
  return join(home, ".config", "opencode");
}

export function getEmpireConfigPath(home = homedir()): string {
  return join(getOpencodeConfigDir(home), "opencode-empire.json");
}

function mergeAgentOptions(fileAgent: EmpireAgentOptions = {}, tupleAgent: EmpireAgentOptions = {}): EmpireAgentOptions {
  return {
    ...fileAgent,
    ...tupleAgent,
    options: {
      ...(fileAgent.options ?? {}),
      ...(tupleAgent.options ?? {}),
    },
    permission: {
      ...((typeof fileAgent.permission === "object" ? fileAgent.permission : {}) ?? {}),
      ...((typeof tupleAgent.permission === "object" ? tupleAgent.permission : {}) ?? {}),
    },
  };
}

function mergeAgents(fileAgents: AgentOptionsMap = {}, tupleAgents: AgentOptionsMap = {}): AgentOptionsMap {
  const roleIds = new Set<EmpireRoleId>([
    ...(Object.keys(fileAgents) as EmpireRoleId[]),
    ...(Object.keys(tupleAgents) as EmpireRoleId[]),
  ]);
  const result: AgentOptionsMap = {};

  for (const roleId of roleIds) {
    result[roleId] = mergeAgentOptions(fileAgents[roleId], tupleAgents[roleId]);
  }

  return result;
}

function mergeEmpireOptions(fileOptions: EmpireOptions, tupleOptions: EmpireOptions): EmpireOptions {
  return {
    tone: tupleOptions.tone ?? fileOptions.tone,
    requireDispatchApproval: tupleOptions.requireDispatchApproval ?? fileOptions.requireDispatchApproval,
    agents: mergeAgents(fileOptions.agents, tupleOptions.agents),
    disabledRoles: tupleOptions.disabledRoles ?? fileOptions.disabledRoles,
  };
}

export async function loadEmpireOptions(input: LoadEmpireOptionsInput = {}): Promise<EmpireOptions> {
  const home = input.home ?? homedir();
  const tupleOptions = (input.tupleOptions ?? {}) as EmpireOptions;

  try {
    const raw = await readFile(getEmpireConfigPath(home), "utf8");
    const fileOptions = JSON.parse(raw) as EmpireOptions;
    return mergeEmpireOptions(fileOptions, tupleOptions);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return tupleOptions;
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse opencode-empire config: ${getEmpireConfigPath(home)}`, { cause: error });
    }
    throw error;
  }
}
