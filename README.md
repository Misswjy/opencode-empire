# opencode-empire

`opencode-empire` 是一个 OpenCode 插件，用于提供带有"司礼监/内阁/六部"风格的多 agent 编排体验。

启动后默认选中司礼监（empire-eunuch）。日常任务司礼监直接处理或以【传旨】形式向六部及内阁派单；需要廷议时切换至内阁（empire-cabinet）。

## Agents

| Agent | 可见 | 模式 | 职责 |
| --- | --- | --- | --- |
| `empire-eunuch` | 是 | primary | 司礼监：日常主 agent。日常问答与简单任务直办，以传旨向六部/内阁派单；需廷议时建议切换内阁 |
| `empire-cabinet` | 是 | all | 内阁：主/子代理。主代理负责票拟、廷议、发部、复奏。子代理被司礼监传旨调用直出票拟 |
| `empire-grand-secretary-a` | 否 | subagent | 隐藏大学士，负责独立审议 |
| `empire-grand-secretary-b` | 否 | subagent | 隐藏大学士，负责独立审议 |
| `empire-grand-secretary-c` | 否 | subagent | 隐藏大学士，负责独立审议 |
| `empire-ministry-personnel` | 是 | subagent | 吏部：执行方案 |
| `empire-ministry-revenue` | 是 | subagent | 户部：代码探索 |
| `empire-ministry-rites` | 是 | subagent | 礼部：方案审核与交互文案 |
| `empire-ministry-war` | 是 | subagent | 兵部：执行流程与自动化 |
| `empire-ministry-justice` | 是 | subagent | 刑部：代码审查与测试把关 |
| `empire-ministry-works` | 是 | subagent | 工部：代码实现 |

## Command

- `/廷议`：请三位隐藏大学士独立审议（需在 empire-cabinet 主代理下使用）。

## Installation

```bash
bunx opencode-empire install
```

安装器会创建：

- `~/.config/opencode/opencode-empire.json`：插件专属配置，用于设置模型、语气、禁用角色等。
- `~/.config/opencode/opencode.json`：OpenCode 全局配置。安装器只会确保其中包含 `"opencode-empire"` 插件，不会覆盖已有字段。

保存后需要重启 OpenCode，运行中的会话不会热加载新配置。

## Configuration

编辑：

```text
~/.config/opencode/opencode-empire.json
```

示例：

```json
{
  "$schema": "https://unpkg.com/opencode-empire@latest/opencode-empire.schema.json",
  "tone": "medium",
  "requireDispatchApproval": true,
  "models": {
    "empire-cabinet": "cockpit/gpt-5.4",
    "empire-ministry-works": "cockpit/gpt-5.5",
    "empire-ministry-justice": "cockpit/gpt-5.5",
    "empire-grand-secretary-a": "cockpit/gpt-5.5",
    "empire-grand-secretary-b": "cockpit/gpt-5.4",
    "empire-grand-secretary-c": "opencode-go/deepseek-v4-flash"
  },
  "disabledRoles": []
}
```

## Workflow

1. 日常使用 `empire-eunuch`（司礼监，默认选中）。
2. 自然描述任务。
3. 简单任务司礼监直接处理。六部任务（探索/实现/审查）司礼监以传旨直接发部，办理后复奏。
4. 复杂票拟需求：司礼监传旨内阁票拟 → 内阁回报票拟 → 司礼监呈皇帝批红 → 批红后传旨六部执行。
5. 需要多方独立审议（廷议）时，切换到 `empire-cabinet`，使用 `/廷议` 召大学士。
6. 六部办理后，审阅 `【内阁复奏】` 或 `【本部复奏】`。

## 传旨格式

```
【传旨】
着令：[内阁/某部]
差事：[任务描述]
办毕复奏。
```

## Options

- `tone`：角色化程度，支持 `light`、`medium`、`high`。
- `requireDispatchApproval`：是否要求派工前再次确认。默认为 `true`；设为 `false` 时，内阁可在已批红票拟范围内直接发部办理。
- `models`：按 agent ID 覆盖模型。
- `disabledRoles`：禁用指定 agent。

## Development

```bash
npm install
npm run verify
```
