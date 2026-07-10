# 创建你的第一条 ERDL 规则

> 10 分钟学会用 ERDL 给你的 Agent 装上"肌肉记忆"。

---

## 1. 规则是什么

ERDL 规则 = `when`（什么时候触发）+ `then`（触发后干什么）。

```
when: 工具名 = "exec" AND 命令 match "rm -rf"
then: DENY "危险命令已拦截"
```

Agent 每次调用工具前，ERDL 都会检查所有规则。匹配到的第一条规则决定放行还是拦截。

---

## 2. 最简单的规则

在你的 `~/.openoba/rules/` 目录下，创建一个 `my-rules.yaml`：

```yaml
rules:
  不要用 any:
    when: 'tool.name = "write_file" OR tool.name = "edit"'
    then: BLOCK "禁止使用 any 类型，请用 unknown 替代"
    category: coding
    priority: 10
```

保存后 ERDL 自动加载。下次你的 Agent 试图写含 `any` 的代码时，会被拦住。

---

## 3. 规则结构

### 完整模板

```yaml
rules:
  规则名称:            # 规则的唯一标识
    when: '条件表达式'   # 什么时候触发（支持 AND / OR / NOT / ()）
    then: 动作 "消息"    # 触发后干什么
    category: coding    # 分类（coding/writing/design/engineering/security/custom）
    priority: 10        # 优先级（1 最高，1000 最低，默认 100）
    override: false     # 是否允许覆盖更高级别的拦截（默认 false）
```

### 支持的分类

| 分类 | 说明 |
|------|------|
| `coding` | 代码规范、命名、类型检查 |
| `engineering` | 工程纪律、流程、质量门禁 |
| `writing` | 文案风格、格式、语气 |
| `design` | UI/UX、响应式、可访问性 |
| `security` | 安全规则、漏洞防护 |
| `performance` | 性能优化约束 |
| `testing` | 测试覆盖率、质量门禁 |
| `compliance` | 合规要求、法规遵循 |
| `accessibility` | 无障碍设计 |
| `custom` | 自定义/未分类 |

---

## 4. when — 条件表达式

### 基础比较

```yaml
# 等于
when: 'tool.name = "exec"'

# 不等于
when: 'tool.name != "web_search"'

# 大于 / 小于 / 大于等于 / 小于等于
when: 'priority > 5'
when: 'risk_level >= 3'
when: 'trust_score < 500'
when: 'count <= 10'
```

### 包含与匹配

```yaml
# 字符串包含
when: 'tool.args.command contains "rm"'

# 值在列表中
when: 'tool.name in ("exec", "write_file", "delete")'

# 正则匹配
when: 'tool.args.command match "(rm -rf|sudo|chmod 777)"'

# 字段存在
when: 'tool.args.path exists'
```

### 逻辑组合

```yaml
# AND（同时满足）
when: 'tool.name = "exec" AND tool.args.command contains "delete"'

# OR（任意满足）
when: 'tool.name = "exec" OR tool.name = "write_file"'

# NOT（取反）
when: 'NOT tool.args.path exists'

# 括号分组
when: '(role = "admin" OR role = "superadmin") AND action = "delete"'
```

---

## 5. then — 动作类型

| 动作 | 含义 | Agent 行为 |
|------|------|-----------|
| `ALLOW "提示"` | 放行，但附带建议 | 正常执行，Agent 遵循提示 |
| `DENY "原因"` | 硬拦截 | 操作被阻止，须修改 |
| `BLOCK "原因"` | 同 DENY | 同上 |
| `CORRECT "纠正"` | 自动纠偏 | 参数被修正后放行 |
| `REQUEST_HUMAN "原因"` | 请求人工审批 | 操作暂停，等待用户确认 |
| `EMERGENCY_HALT "原因"` | 紧急终止 | 全局停止，最高警戒 |

---

## 6. 实战示例

### 编码规范

```yaml
rules:
  禁止 console.log:
    when: 'tool.name in ("write_file", "edit") AND tool.args.content contains "console.log"'
    then: DENY "提交前请删除 console.log，使用项目 Logger 替代"
    category: coding
    priority: 5

  强制 try-catch:
    when: 'tool.name = "write_file" AND tool.args.path match "\\.tsx?$"'
    then: ALLOW "异步操作必须用 try-catch 包裹，在 catch 块记录日志"
    category: coding
    priority: 10
```

### 安全规则

```yaml
rules:
  危险命令拦截:
    when: 'tool.name = "exec" AND tool.args.command match "(rm -rf|sudo|chmod 777|> /dev/sda)"'
    then: EMERGENCY_HALT "检测到危险系统命令，已全局终止"
    category: security
    priority: 1
    override: false

  敏感文件保护:
    when: 'tool.name = "write_file" AND tool.args.path match "(\\.env|\\.git/config|/etc/)"'
    then: DENY "禁止修改敏感配置文件"
    category: security
    priority: 2
```

### 写作规范

```yaml
rules:
  禁止陈词滥调:
    when: 'tool.name = "write_file" AND tool.args.content contains "在当今数字化时代"'
    then: CORRECT "请用具体场景替代空洞的套话"
    category: writing
    priority: 10

  中英文空格:
    when: 'tool.name = "write_file" AND tool.args.path match "\\.md$"'
    then: ALLOW "中英文之间、中文与数字之间加空格"
    category: writing
    priority: 20
```

### 工程纪律

```yaml
rules:
  禁止 git stash:
    when: 'tool.name = "exec" AND tool.args.command contains "stash"'
    then: DENY "禁止 git stash 累积。所有变更必须入 commit。"
    category: engineering
    priority: 4

  推送前检查:
    when: 'tool.name = "exec" AND tool.args.command contains "push"'
    then: ALLOW "推送前: typecheck 0 error → build 0 error → test all pass"
    category: engineering
    priority: 3
```

---

## 7. 优先级与覆盖

### 优先级

- 数字越小越优先（1 最高）
- 同一优先级按定义顺序
- 没有规则匹配时默认放行（ALLOW）

### override 硬约束

```yaml
规则A:
  when: 'tool.name = "exec"'
  then: DENY "所有命令被拦截"
  priority: 1
  override: false  # 不可被覆盖

规则B:
  when: 'tool.args.command contains "git"'
  then: ALLOW "git 命令例外放行"
  priority: 1
  override: true   # 可以覆盖规则A的拦截

# 结果: git 命令放行，非 git 命令被拦截
```

---

## 8. 测试你的规则

用 `erdl_simulate` 工具测试：

```
你: "创建一条规则：禁止使用 eval 执行代码"

Agent: erdl_simulate → 给出 3 个场景的测试结果：
  ✅ 场景1 "eval(code)" → 正确拦截
  ✅ 场景2 "new Function(str)" → 正确拦截
  ❌ 场景3 "setTimeout('code', 100)" → 没有拦截
  建议: 把 "setTimeout" 加入关键词列表

你: "好，把 setTimeout 加进去"
Agent: erdl_create_rule → 规则保存，立即生效
```

---

## 9. 常用运算符速查

| 运算符 | 含义 | 示例 |
|--------|------|------|
| `=` | 等于 | `tool.name = "exec"` |
| `!=` | 不等于 | `env != "production"` |
| `>` | 大于 | `risk_level > 3` |
| `<` | 小于 | `trust_score < 500` |
| `>=` | 大于等于 | `count >= 10` |
| `<=` | 小于等于 | `retries <= 3` |
| `in ("a","b")` | 在列表中 | `tool.name in ("exec", "write")` |
| `contains "x"` | 包含子串 | `command contains "delete"` |
| `match "regex"` | 正则匹配 | `path match "\\.env$"` |
| `exists` | 字段存在 | `tool.args.path exists` |
| `AND` | 逻辑与 | `a = 1 AND b = 2` |
| `OR` | 逻辑或 | `a = 1 OR b = 2` |
| `NOT` | 逻辑非 | `NOT field exists` |
| `()` | 括号分组 | `(A OR B) AND C` |

---

## 10. 下一步

1. 在 `~/.openoba/rules/custom/` 下创建你的第一条规则
2. 用 `erdl_evaluate` 验证规则是否生效
3. 用 `erdl_explain` 查看 Agent 为什么做了某个决定
4. 遇到问题？[GitHub Issues →](https://github.com/OpenOBA/erdl-mcp-server/issues)

---

> 确定性架构，而非 Prompt 工程。
> OpenOBA · 2026
