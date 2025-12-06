# Query Layer (DuckDB-Wasm + SQL.js Fallback)

为了兼顾现代浏览器/桌面端与受限环境，我们设计了统一的 `QueryLayer`，在 `src/lib/data/db/createQueryLayer.ts` 中实现。

## 工作流程

1. **首选 DuckDB-Wasm**  
   - 检测 `Worker`/`window` 是否存在；若可用，加载 `@duckdb/duckdb-wasm` bundle 并创建 `AsyncDuckDB` 连接。
   - 对外暴露 `exec(sql, params?)` 与 `close()`。

2. **Fallback: SQL.js (SQLite)**  
   - 当 wasm/worker 不可用或初始化失败时，自动退回到 SQL.js（在 Node 环境从 `node_modules/sql.js/dist` 加载 `.wasm`）。
   - 同样提供 `exec/close`，确保上层调用代码不需要区分。

配置可在 `src/config/queryLayer.ts` 中扩展，例如：

```ts
export interface QueryEngineConfig {
  preferred: 'duckdb-wasm' | 'sqlite';
  sqliteLocateFile?: (file: string) => string;
}
```

默认逻辑：若 `preferred` 为 wasm 但初始化失败，则按顺序尝试 fallback；若用户直接指定 sqlite，则跳过 wasm。

## 测试策略

1. **Wasm 模式**：在浏览器/SSR 下调用 `getQueryLayer()`，应返回 DuckDB 实例，可执行基本 SQL（需在合适环境验证）。
2. **Fallback 模式**：在 Node 中手动禁用 `Worker`（`globalThis.Worker = undefined`），再调用 `getQueryLayer()`，应使用 SQL.js 并返回正常结果。当前测试脚本示例：

```bash
npx tsx --tsconfig tsconfig.json <<'TS'
import { getQueryLayer } from './src/lib/data/db/createQueryLayer.ts';
const originalWorker = globalThis.Worker;
(globalThis as any).Worker = undefined;
const layer = await getQueryLayer();
const rows = await layer.exec<{ value: number }>('SELECT 1 as value');
console.log('fallback rows', rows);
await layer.close();
(globalThis as any).Worker = originalWorker;
TS
```

输出示例：
```
[DB] DuckDB-Wasm 初始化失败，回退至 fallback Error: DuckDB-Wasm 需要浏览器环境
fallback rows [ { value: 1 } ]
```

3. **静态检查**：`npm run check` 确保 TypeScript/构建无误。

## 下一步

- 把 QueryLayer 的配置（preferred engine、fallback 顺序）纳入 `src/config`，以便不同部署环境切换策略。
- 在 fallback 模式下提供数据持久化（例如 SQLite 输出到文件/IndexedDB）。
