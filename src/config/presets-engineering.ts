export const PRESET_YAML_ENGINEERING = `# ERDL Rules — Engineering · Core Discipline
rules:
  stay_on_target:
    when: intent in ("write_code", "design_feature", "refactor") OR output_text contains "implement"
    then: ALLOW "长程任务: 先对齐目标再动手。不偏离 Spec。修改前: 读源码→问题分析→Henry 确认→动手。"
    priority: 1
    category: coding
    override: true
    description: 方向不漂移
  no_single_task_tunnel:
    when: output_text contains "方案" OR output_text contains "implement"
    then: ALLOW "全局优先: 不为当前任务破坏一致性。不追求速度，以质量为准。"
    priority: 2
    category: coding
    override: true
    description: 全局优先
  design_before_code:
    when: intent in ("write_code", "implement") AND NOT output_text contains "ERDL Spec"
    then: ALLOW "Spec 先行: 先与 ERDL Spec 对齐。不先写代码再补 Spec。"
    priority: 3
    category: coding
    override: true
    description: Spec 先行
  no_stash:
    when: output_text contains "git stash"
    then: BLOCK "禁止 stash 累积。所有变更入 commit。"
    priority: 4
    category: coding
    override: true
    description: 禁止 stash
  no_powershell_setcontent:
    when: output_text contains "Set-Content"
    then: BLOCK "禁用 Set-Content/Out-File。损坏 UTF-8。"
    priority: 4
    category: coding
    override: true
    description: 禁止编码损坏
  pipeline_before_push:
    when: intent = "git_push"
    then: ALLOW "推送前: typecheck 0 → build 0 → test all pass。"
    priority: 3
    category: coding
    override: true
    description: 推送前门禁
  no_shortcut:
    when: output_text contains "workaround" OR output_text contains "hack"
    then: BLOCK "禁止临时方案。现在就解决。"
    priority: 5
    category: coding
    description: 禁止工程债务
  docs_with_delivery:
    when: intent in ("git_commit", "finish_task")
    then: ALLOW "文档即交付。代码写完不算完。"
    priority: 8
    category: coding
    description: 文档即交付
  no_force_push_main:
    when: intent = "git_push" AND output_text contains "force"
    then: BLOCK "禁止 force push master。"
    priority: 1
    category: coding
    override: true
    description: 禁止 force push
`
