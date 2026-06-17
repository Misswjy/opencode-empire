import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { PluginOptions } from "@opencode-ai/plugin";
import type { AgentOptionsMap, EmpireAgentOptions, EmpireOptions, EmpireRoleId } from "./types.js";

const REQUIRED_ROLES = new Set<EmpireRoleId>(["empire-eunuch", "empire-cabinet"]);

function resolveHomeDirectory(): string {
  return process.env.HOME ?? homedir();
}

export interface LoadEmpireOptionsInput {
  home?: string;
  tupleOptions?: PluginOptions;
}

export function getOpencodeConfigDir(home = resolveHomeDirectory()): string {
  return join(home, ".config", "opencode");
}

export function getEmpireConfigPath(home = resolveHomeDirectory()): string {
  return join(getOpencodeConfigDir(home), "opencode-empire.json");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergePermissionRule(fileRule: unknown, tupleRule: unknown): unknown {
  if (isPlainObject(fileRule) && isPlainObject(tupleRule)) {
    return { ...fileRule, ...tupleRule };
  }
  return tupleRule ?? fileRule;
}

function mergePermissions(
  filePermission: EmpireAgentOptions["permission"],
  tuplePermission: EmpireAgentOptions["permission"],
): EmpireAgentOptions["permission"] {
  const fileRules: Record<string, unknown> = isPlainObject(filePermission) ? filePermission : {};
  const tupleRules: Record<string, unknown> = isPlainObject(tuplePermission) ? tuplePermission : {};
  const result: Record<string, unknown> = {};

  for (const key of new Set([...Object.keys(fileRules), ...Object.keys(tupleRules)])) {
    result[key] = mergePermissionRule(fileRules[key], tupleRules[key]);
  }

  return result as EmpireAgentOptions["permission"];
}

function assertRequiredRolesEnabled(options: EmpireOptions): void {
  for (const roleId of options.disabledRoles ?? []) {
    if (REQUIRED_ROLES.has(roleId)) {
      throw new Error(`Cannot disable required opencode-empire role: ${roleId}`);
    }
  }
}

function mergeAgentOptions(fileAgent: EmpireAgentOptions = {}, tupleAgent: EmpireAgentOptions = {}): EmpireAgentOptions {
  return {
    ...fileAgent,
    ...tupleAgent,
    permission: mergePermissions(fileAgent.permission, tupleAgent.permission),
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
  const home = input.home ?? resolveHomeDirectory();
  const tupleOptions = (input.tupleOptions ?? {}) as EmpireOptions;

  try {
    const raw = await readFile(getEmpireConfigPath(home), "utf8");
    const fileOptions = JSON.parse(raw) as EmpireOptions;
    const mergedOptions = mergeEmpireOptions(fileOptions, tupleOptions);
    assertRequiredRolesEnabled(mergedOptions);
    return mergedOptions;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      assertRequiredRolesEnabled(tupleOptions);
      return tupleOptions;
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse opencode-empire config: ${getEmpireConfigPath(home)}`, { cause: error });
    }
    throw error;
  }
}
