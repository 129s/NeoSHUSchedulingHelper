# PLAN

| ID        | Title                                      | Bucket    | Kind           | Status | DependsOn          | Notes |
|-----------|--------------------------------------------|-----------|----------------|--------|--------------------|-------|
| MIG-1     | 完成 2025-migration change 的所有 task      | MIGRATION | spec/process   | DONE   | -                  | 任务 T-1~T-9 全部勾选 |
| MIG-2     | 统一 AGENTS.md 并验证 Codex 遵守             | MIGRATION | meta           | DONE   | -                  | 根 AGENTS 已重写 |
| MIG-3     | 接通 MCP（chrome-devtools + gemini）验证     | MIGRATION | infra/mcp      | TODO   | -                  | 配置已写入，待验证 |
| FE-NOW-1  | 实现当前 solver 调试友好的 minimal UI       | NOW       | code/ui        | TODO   | MIG-1              |       |
| FE-LATER-1| 设计 solver tab linear flow + polish 行为   | LATER     | spec/ui        | TODO   | MIG-1              |       |
| FE-LATER-2| 为 solver tab 配置 UI review (MCP + Gemini) | LATER     | mcp/ui-review  | TODO   | FE-NOW-1, MIG-3    |       |
