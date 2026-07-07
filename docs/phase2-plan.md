# ERDL MCP Server — Phase 2 开发清单

> 日期：2026-07-07 · 作者：唐浩然 · 状态：📋 待 Henry 确认

---

## 一、Phase 2 目标

将 ERDL MCP Server 从 **ERDL v1.1 BNF 表达式引擎** 升级为 **ERDL Protocol Spec Agent 行为规则系统**。

**当前对齐率：BNF 100% · Agent 架构 40% → Phase 2 目标：90%+**

---

## 二、要做的事（按优先级）

### 🔴 P0 — Execution Ring 0–3 决策模型

| # | 任务 | 说明 |
|---|------|------|
| 1 | **新增第 4–13 号 Action 类型** | 当前只有 ALLOW/DENY/PASS。需新增 CORRECT, STRATEGIZE, AUDIT, VALIDATE, NOTIFY, ESCALATE, DELEGATE, ROLLBACK, QUARANTINE, EMERGENCY_HALT |
| 2 | **执行环约束** | Ring 0（Guardian）只支持 BLOCK/EMERGENCY_HALT。Ring 3（Observed）支持全部。then 表达式需加 ring 声明 |
| 3 | **`REQUEST_HUMAN` 动作** | Agent 被阻断时向用户请求人工审批，而非直接返回 DENY。需要对话交互协议 |
| 4 | **`EMERGENCY_HALT` 全局效果** | 不只是阻断单次调用，而是通知所有被监管 Agent 停止 |
| 5 | **`ROLLBACK` 实现** | Rollback 需要 Checkpoint 快照机制——Phase 2 最小实现：回滚到最后一次 ERDL 规则检查通过的快照 |

**讨论点**：
- EMERGENCY_HALT 在 MCP 层面如何实现？关闭进程？发送信号？
- ROLLBACK 的最小实现是什么？文件系统备份？Git reset？

---

### 🟠 P1 — Guardian / Observed Agent 角色模型

| # | 任务 | 说明 |
|---|------|------|
| 6 | **Guardian Agent 声明** | 在 `.erdl.yaml` 中声明 `agent: { role: guardian, observes: [agent-id-1] }` |
| 7 | **跨 Agent Tool Call 拦截** | Guardian 连接多个 Observed Agent 的 MCP Server，拦截他们的 tool call |
| 8 | **冲突处理** | 多个 Guardian 对同一操作给出矛盾裁决 → 收集所有决定的冲突审计记录 → 触发 REQUEST_HUMAN |
| 9 | **信任评分计算** | 1–1000 分，动态计算（历史违规次数、合规率、BOM 完整性），**仅建议不强制**（Protocol Spec 注明了社区反馈） |

**讨论点**：
- 同一个 ERDL MCP Server 既是 Guardian 又是 Observed 吗？还是分开部署？
- 信任评分对个人用户有意义吗？还是企业场景才需要？

---

### 🟡 P2 — 扩展属性

| # | 任务 | 说明 |
|---|------|------|
| 10 | **`within` 时间窗口** | 条件必须持续满足，不只是点判断。用于：3 次错误/1 分钟内 → 触发告警 |
| 11 | **`rate` 速率限制** | `"10/1m"` = 1 分钟内最多 10 次。用于：API 调用限频 |
| 12 | **`state` 状态机** | `when: state = "draft" then: state → "review"` — 规则按状态分组求值 |
| 13 | **`combine` 多规则聚合** | 收集多条规则的输出再统一决策。用于金融风险信号聚合 |

**讨论点**：
- `within` 需要持久化历史记录（文件/内存？）
- `state` 适合个人用户吗？还是太复杂了？
- `combine` 对个人场景的适用性？

---

### 🟢 P3 — 审计 & 合规

| # | 任务 | 说明 |
|---|------|------|
| 14 | **结构化审计日志** | 每条规则决策 → UUID v7 · timestamp · agent_id · ring_level · trace_id |
| 15 | **跨 Agent 审计链** | 父子审计 ID 链：`audit_001 → audit_002 → audit_003` |
| 16 | **OCSF + OTLP 导出** | 标准审计格式导出 |

**讨论点**：
- 个人用户需要审计吗？还是仅企业？Phase 2 最小实现：JSON 文件 + 控制台输出

---

### 🔵 P4 — 身份 & AgBOM

| # | 任务 | 说明 |
|---|------|------|
| 17 | **Agent Identity** | `agent: { id: "did:erdl:xxx", name, version }` |
| 18 | **AgBOM** | 声明 LLM 模型 · tools · skills · SDKs — 供给 Guardian 做合规检查 |
| 19 | **Tool/Skill 清单** | 扫描 Agent 的可用 tools/skills 自动生成 BOM |

**讨论点**：
- 个人用户需要声明身份吗？这可能增加部署复杂度
- AgBOM 的最小实现：`.erdl.yaml` 中的 `agent:` 块 + `bom:` 块

---

## 三、战略决策点（需要 Henry 讨论）

| # | 决策 | 选项 |
|---|------|------|
| D1 | **Execution Ring 实现深度** | A. 完整 4 Rings + 14 Actions — 实现 Protocol Spec 全套 / B. 最小 2 Rings（0+3）— 只做 BLOCK + EMERGENCY_HALT + ALLOW / C. 渐进：Phase 2 做 Ring 0–3，Phase 3 做 Ring 1–2 |
| D2 | **Guardian Agent 部署模式** | A. 同一个 MCP Server 进程同时是 Guardian + Observed / B. 分开部署：Guardian 监听 Observed 的 MCP 事件 |
| D3 | **个人用户 vs 企业用户优先级** | A. 先做个人场景相关的（BLOCK, ALLOW, CORRECT, REQUEST_HUMAN）/ B. 完整 Protocol Spec（含 AUDIT, ESCALATE, QUARANTINE） |
| D4 | **审计日志深度** | A. 最小化：JSON 文件 / B. 完整：UUID v7 + trace + OTLP 导出 |
| D5 | **Dashboard 实时化** | ERDL MCP Server 加 mini HTTP API → Dashboard 显示命中统计 |

---

## 四、Phase 2 工作量估算

| 优先级 | 任务数 | 估时 |
|--------|:------:|------|
| P0 — Execution Ring | 5 | 2 天 |
| P1 — Guardian Agent | 4 | 1.5 天 |
| P2 — 扩展属性 | 4 | 1 天 |
| P3 — 审计 | 3 | 0.5 天 |
| P4 — 身份 AgBOM | 3 | 0.5 天 |
| **合计** | **19** | **5.5 天** |

---

> 唐浩然 · OpenOBA AI 执行官 · 2026-07-07
