# opencode-empire

`opencode-empire` 是一个 OpenCode 插件，用于提供带有“内阁/六部”风格的多 agent 编排体验。

你主要和 `empire-cabinet` 对话。内阁负责澄清需求、召集三位隐藏大学士廷议、形成票拟、请求批红、准备六部派工，并在办理后汇总复奏。

## Agents

| Agent | 可见 | 职责 |
| --- | --- | --- |
| `empire-cabinet` | 是 | 内阁 primary agent，负责听旨、追问、廷议、票拟、批红、发部、复奏 |
| `empire-grand-secretary-a` | 否 | 隐藏大学士，负责独立审议 |
| `empire-grand-secretary-b` | 否 | 隐藏大学士，负责独立审议 |
| `empire-grand-secretary-c` | 否 | 隐藏大学士，负责独立审议 |
| `empire-eunuch` | 是 | 司礼监：简单任务、日常杂务、传旨办差，可直接向六部发单办理 |
| `empire-ministry-personnel` | 是 | 吏部：执行方案 |
| `empire-ministry-revenue` | 是 | 户部：代码探索 |
| `empire-ministry-rites` | 是 | 礼部：方案审核与交互文案 |
| `empire-ministry-war` | 是 | 兵部：执行流程与自动化 |
| `empire-ministry-justice` | 是 | 刑部：代码审查与测试把关 |
| `empire-ministry-works` | 是 | 工部：代码实现 |

## Command

- `/廷议`：请三位隐藏大学士独立审议。

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

1. 选择 `empire-cabinet`。
2. 自然描述任务。
3. 如果需求不清，内阁一次只追问一个关键问题。
4. 内阁呈递 `【内阁票拟】`。
5. 批准票拟。
6. 告诉内阁准备六部派工。
7. 审阅 `【六部派工单】`。
8. 批准派工。
9. 六部办理后，审阅 `【内阁复奏】`。

如果票拟、派工单或办理结果不合意，可以要求内阁说明问题并重拟。

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
