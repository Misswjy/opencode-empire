# 司礼监为日常主代理

> 2026-05-27 — 将司礼监（empire-eunuch）设为 OpenCode 默认 agent，内阁（empire-cabinet）mode 改为 "all" 支持作为子代理被传旨调用。

## 设计

### 架构

两个 primary agent 分工协作。司礼监为默认入口，内阁为复杂需求入口。内阁同时作为子代理，可被司礼监传旨调用。

```
司礼监 (primary, default_agent)
  ├── 日常问答 → 直接处理
  ├── 探索/实现/审查 → 传旨六部 (subagent) → 复奏
  ├── 复杂票拟 → 传旨内阁 (subagent/all) → 票拟 → 呈批红 → 传旨六部
  └── 需要廷议 → 建议用户切换至内阁 (primary)

内阁 (mode: "all")
  ├── 作为 subagent (被司礼监传旨) → 直接票拟，不廷议
  └── 作为 primary (用户手动切换) → 票拟 + /廷议 召大学士
```

### 分流规则

| 场景 | 入口 | 司礼监动作 |
|------|------|-----------|
| 日常问答、信息查询 | 司礼监 | 直接回答 |
| 代码探索/实现/审查 | 司礼监 | 传旨六部 → 复奏 |
| 复杂票拟（无需多方审议） | 司礼监 | 传旨内阁 → 票拟 → 呈批红 → 传旨六部 |
| 复杂票拟+廷议 | 内阁(primary) | 建议用户切换至内阁 |

### 文书格式

司礼监传旨内阁/六部使用统一传旨格式：
```
【传旨】
着令：[内阁/某部]
差事：[任务描述]
办毕复奏。
```

### 改动文件

- `src/defaults.ts`：内阁 mode 改为 "all"，司礼监描述更新
- `src/prompts.ts`：新增传旨模板，重写司礼监/内阁 prompt（含 mode:all 双模式职责说明）
- `src/index.ts`：设 `config.default_agent = "empire-eunuch"`
- `src/__tests__/agents.test.ts`：覆盖 mode:all、新 prompt、default_agent
- `src/__tests__/plugin.test.ts`：覆盖 default_agent
- `README.md`：同步入口、agent 表格、工作流
