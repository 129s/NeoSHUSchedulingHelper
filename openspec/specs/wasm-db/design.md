# DuckDB-Wasm 集成计划

为保证课程数据在浏览器/Node SSR 双端都能以统一方式查询、做 diff 和调试，我们决定引入新潮的 WebAssembly 数据库 **DuckDB-Wasm**（`@duckdb/duckdb-wasm`）作为本地分析引擎。DuckDB 具备列式、向量化执行能力，Wasm 版本可直接加载到 SvelteKit 客户端或 worker，适合进行跨课程的聚合/冲突检查。

## 集成方式

1. 在 `package.json` 添加依赖 `@duckdb/duckdb-wasm`（已安装）。
2. 新增 `src/lib/data/duckdbClient.ts`，封装 `getDuckDB()`：
   - 使用 `duckdb.selectBundle(duckdb.getJsDelivrBundles())` 自动选择合适的 Wasm 资源。
   - 创建 `new Worker(new URL('@duckdb/duckdb-wasm/dist/duckdb-browser.worker.js', import.meta.url), { type: 'module' })`。
   - 通过 `new duckdb.AsyncDuckDB(logger, worker)` 实例化，并缓存 `Promise` 以供全局复用。
3. 在 parser 或调试工具中，需要执行 SQL 时调用 `const db = await getDuckDB()`，然后创建连接 `await db.connect()`，将 `InsaneCourseData` 物化到 DuckDB 的内存表中。

## 使用场景

- **课程冲突检测**：用 SQL 查询 `SELECT courseHash, day, period FROM schedule`，快速查找重复占用。
- **容量分析**：SQL 聚合 `SUM(capacity)` / `SUM(vacancy)`，对比不同学院/校区。
- **历史 diff**：将两份 snapshot 数据分别导入 `duckdb`，执行 `EXCEPT` 来定位差异。
- **调试工作台**：Dockable UI 可把 DuckDB 结果直接渲染为 panel。

## 下一步

- 结合 `InsaneCourseParser`，提供 `insertCourseRecords(db, dataset)` 帮助函数，把 `courses`, `sections`, `scheduleChunks` 落到 DuckDB 临时表。
- 评估持久化方案（IndexedDB + DuckDB wasm block cache）以支持离线缓存。
