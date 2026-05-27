# Agent Scoped Model Options And Permissions

## Summary

Add one optional per-agent configuration map to `opencode-empire.json`:

- `agents`: object keyed by empire agent ID. Each value can configure that agent's `model`, model `options`, and partial `permission` overrides.

This keeps model selection, reasoning-style model options, and permissions next to the agent they affect while preserving existing defaults for prompts, temperature, mode, visibility, and safety boundaries.

## Goals

- Allow users to configure each agent in one place instead of spreading related settings across multiple top-level maps.
- Allow model/provider-specific reasoning settings such as `reasoningEffort` through the generated opencode agent `options` field.
- Allow users to adjust generated agent permissions without replacing the entire default permission set.
- Preserve existing behavior when the new fields are absent.
- Keep validation scoped to known empire agent IDs.

## Non-Goals

- Do not introduce a first-class `reasoning` field.
- Do not allow arbitrary full agent configuration overrides.
- Do not change the default permission policy for any existing agent.
- Do not remove the existing `models` field in this change; keep it as a supported legacy/convenience override unless a future breaking change removes it.

## Configuration Shape

Example:

```json
{
  "$schema": "https://unpkg.com/opencode-empire@latest/opencode-empire.schema.json",
  "agents": {
    "empire-cabinet": {
      "model": "cockpit/gpt-5.5",
      "options": { "reasoningEffort": "high" },
      "permission": { "edit": "deny", "bash": "ask" }
    },
    "empire-ministry-works": {
      "model": "cockpit/gpt-5.5",
      "options": { "reasoningEffort": "medium" },
      "permission": { "edit": "ask" }
    }
  }
}
```

`agents[roleId].model` overrides the generated agent model.

`agents[roleId].options` accepts object values and passes them through to the generated agent's `options` field.

`agents[roleId].permission` accepts a partial permission object. Each configured agent starts from the plugin's default permission set, then shallow-merges the configured permission keys.

## Merge Behavior

Dedicated file config and tuple plugin options continue to merge through `loadEmpireOptions`.

- Scalar fields keep the existing behavior: tuple options override file options.
- `models` continues to merge per agent with tuple values taking precedence.
- `agents` merges per agent. If both sources configure the same agent, their agent config objects are shallow-merged and tuple keys win.
- `agents[roleId].options` merges shallowly when both sources configure it, with tuple keys winning.
- `agents[roleId].permission` merges shallowly when both sources configure it, with tuple keys winning.
- `disabledRoles` keeps the existing behavior: tuple value replaces file value when provided.

When both legacy `models[roleId]` and new `agents[roleId].model` are present after merging, `agents[roleId].model` wins because it is the more specific agent-scoped configuration.

## Agent Generation

`buildEmpireAgents` keeps the current generated fields:

- `description`
- `mode`
- `hidden`
- `model`
- `prompt`
- `temperature`
- `permission`

For each role:

1. Skip the role if it is disabled.
2. Build the default permission using the existing edit-capability rule.
3. Select the model from `agents[role.id].model`, then `models[role.id]`, then the role default.
4. Merge the configured `agents[role.id].permission` into the default permission when present.
5. Assign the configured `agents[role.id].options` to `agent.options` when present.
6. Leave `agent.options` undefined when there is no configured value.

## Schema And Documentation

Update `opencode-empire.schema.json` to define `agents` as an object keyed by the existing `EmpireRoleId` enum. Each agent config can contain `model`, `options`, and `permission`.

Update README configuration examples and option descriptions to show agent-scoped model, reasoning-style `options`, and partial permission overrides.

Update installer defaults to include an `agents` map so generated config files make the new capabilities discoverable next to each agent.

## Testing

Add tests for:

- `buildEmpireAgents` uses configured `agents[roleId].model` over legacy `models[roleId]` and defaults.
- `buildEmpireAgents` writes configured `agents[roleId].options` to the target agent.
- `buildEmpireAgents` shallow-merges configured `agents[roleId].permission` with defaults.
- `loadEmpireOptions` merges file and tuple `agents` per agent with tuple precedence.
- `loadEmpireOptions` shallow-merges nested `options` and `permission` objects for the same agent.

Run the existing verification command after implementation:

```bash
npm run verify
```
