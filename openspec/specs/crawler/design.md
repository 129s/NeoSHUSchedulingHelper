# Crawler 数据源配置

为保证解析器能在 monorepo 或独立部署下稳定获取课表快照，我们在 `src/config/crawler.ts` 中定义了统一的配置结构，支持本地目录与远程对象存储（后续可扩展）。

## 配置结构

```ts
interface CrawlerSourceConfig {
  id: string;             // 配置标识，便于日志和多源切换
  localRoot: string;      // 本地 crawler 仓库根目录
  termsDir: string;       // 学期 JSON 相对路径，如 data/terms
  indexFile: string;      // 索引文件相对路径，例如 data/terms/index.json
  remote?: {
    kind: 'object-storage';
    endpoint: string;     // S3/OSS/MinIO 等 Endpoint
    bucket: string;
    prefix?: string;      // 远程对象前缀，默认 terms/
    indexKey?: string;    // 索引对象 Key，默认 index.json
  };
}
```

默认值：

```ts
const DEFAULT_CONFIG = {
  id: 'local-monorepo',
  localRoot: path.resolve(import.meta.env?.VITE_CRAWLER_ROOT ?? '..', 'crawler'),
  termsDir: 'data/terms',
  indexFile: 'data/terms/index.json',
  remote: {
    kind: 'object-storage',
    endpoint: import.meta.env?.VITE_CRAWLER_REMOTE_ENDPOINT ?? 'https://storage.example.com',
    bucket: import.meta.env?.VITE_CRAWLER_REMOTE_BUCKET ?? 'shu-course-terms',
    prefix: 'terms/',
    indexKey: 'index.json'
  }
};
```

通过 `getCrawlerConfig(overrides)` 可按需覆盖字段，配合环境变量 `VITE_CRAWLER_ROOT` / `VITE_CRAWLER_REMOTE_*` 即可无侵入切换。

常用帮助函数：

- `resolveTermFile(termId)`：返回某个学期 JSON 的本地路径（例如 `crawler/data/terms/2025-16.json`）。
- `resolveIndexFile()`：返回索引文件路径，供 parser 或同步脚本读取。

## 索引规范（建议）

为了在对象存储或多端环境快速枚举学期文件，建议维护 `data/terms/index.json`，结构如下：

```jsonc
[
  {
    "id": "2025-16",
    "file": "2025-16.json",
    "hash": "5e924c29bb03e4b7d03c9cd0d7493e2e",
    "updatedAt": 1764847274263,
    "size": 742311,
    "notes": "2025-2026 春"
  }
]
```

Parser 在启动时可读取索引，选择最新快照，也能与远程对象存储对齐（`bucket/prefix/file`）。

## 未来扩展

1. **多源热切换**：根据 termName 或 hash 指定不同 bucket/region。
2. **缓存策略**：在本地缓存对象存储结果，或通过 ETag/Last-Modified 做增量更新。
3. **鉴权**：若对象存储需要授权，可在配置中扩展 `credentials` 字段（如临时令牌/签名策略）。
4. **监控**：结合 `id` + `notes` 记录同步来源，方便 log/metrics 聚合。
