# opencode-empire

`opencode-empire` is an OpenCode plugin for imperial-style multi-agent orchestration.

You talk to `empire-cabinet`. The cabinet clarifies requirements, convenes three hidden grand secretaries, drafts a proposal, asks for approval, prepares a ministry dispatch, and summarizes results.

## Agents

| Agent | Visible | Role |
| --- | --- | --- |
| `empire-cabinet` | Yes | Cabinet primary agent for 听旨、追问、廷议、票拟、批红、发部、复奏 |
| `empire-grand-secretary-a` | No | Hidden grand secretary for independent deliberation |
| `empire-grand-secretary-b` | No | Hidden grand secretary for independent deliberation |
| `empire-grand-secretary-c` | No | Hidden grand secretary for independent deliberation |
| `empire-ministry-personnel` | Yes | 吏部: execution plan |
| `empire-ministry-revenue` | Yes | 户部: code exploration |
| `empire-ministry-rites` | Yes | 礼部: plan review and interaction copy |
| `empire-ministry-war` | Yes | 兵部: execution and automation |
| `empire-ministry-justice` | Yes | 刑部: code review and test gate |
| `empire-ministry-works` | Yes | 工部: code implementation |

## Commands

- `/票拟`: enter proposal drafting.
- `/廷议`: ask the three hidden grand secretaries to deliberate.
- `/批红`: approve a proposal or dispatch.
- `/驳回`: reject and ask the cabinet to redraft.
- `/发部`: prepare ministry dispatch.
- `/复奏`: summarize current results, evidence, risks, and decisions.

## Configuration

```json
{
  "plugin": [
    [
      "opencode-empire",
      {
        "tone": "medium",
        "requireDispatchApproval": true,
        "models": {
          "empire-cabinet": "cockpit/gpt-5.4",
          "empire-ministry-works": "cockpit/gpt-5.5",
          "empire-ministry-justice": "cockpit/gpt-5.5",
          "empire-grand-secretary-a": "cockpit/gpt-5.5",
          "empire-grand-secretary-b": "cockpit/gpt-5.4",
          "empire-grand-secretary-c": "opencode-go/deepseek-v4-flash"
        }
      }
    ]
  ]
}
```

## Workflow

1. Choose `empire-cabinet`.
2. Describe the task naturally.
3. The cabinet asks one clarifying question at a time when needed.
4. The cabinet presents `【内阁票拟】`.
5. Approve with `/批红`.
6. Ask for `/发部` or tell the cabinet to dispatch ministries.
7. Review `【六部派工单】`.
8. Approve dispatch.
9. Review `【内阁复奏】` after ministries report back.

## Development

```bash
npm install
npm run verify
```
