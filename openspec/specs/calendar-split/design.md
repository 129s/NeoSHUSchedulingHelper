# 课程表切分实现总结

## 修改内容

### 1. CourseCalendarPanel.svelte

**新增 `getClipPath()` 函数**：根据 `weekSpan` 和 `weekParity` 计算 clip-path

```typescript
function getClipPath(entry: DemoCalendarEntry): string {
  // 极端组合（4种）
  if (上半学期 && 单周) return 'polygon(0 0, 100% 0, 0 100%)';      // 左上角三角形
  if (上半学期 && 双周) return 'polygon(0 0, 100% 0, 100% 100%)';   // 右上角三角形
  if (下半学期 && 单周) return 'polygon(0 0, 0 100%, 100% 100%)';   // 左下角三角形
  if (下半学期 && 双周) return 'polygon(100% 0, 100% 100%, 0 100%)'; // 右下角三角形
  
  // 单一切分（4种）
  if (上半学期) return 'polygon(0 0, 100% 0, 100% 50%, 0 50%)';     // 上半矩形
  if (下半学期) return 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)'; // 下半矩形
  if (单周) return 'polygon(0 0, 50% 0, 50% 100%, 0 100%)';         // 左半矩形
  if (双周) return 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)';   // 右半矩形
  
  return 'none';
}
```

**修改 `buildBlockStyle()`**：应用 clip-path 到 style

```typescript
function buildBlockStyle(entry: DemoCalendarEntry) {
  const clipPath = getClipPath(entry);
  return [
    // ... 其他样式
    clipPath !== 'none' ? `clip-path:${clipPath}` : ''
  ].filter(Boolean).join(';');
}
```

**删除伪元素样式**：移除 `::before` 和 `::after` 的白色遮罩层

### 2. sampleCourses.ts

**新增 4 个极端测试用例**：

| ID | 课程名称 | 时间 | weekSpan | weekParity |
|----|---------|------|----------|-----------|
| TEST-EXTREME-1 | 极端测试-上半单周 | 周四 7-8节 | 上半学期 | 单周 |
| TEST-EXTREME-2 | 极端测试-上半双周 | 周四 9-10节 | 上半学期 | 双周 |
| TEST-EXTREME-3 | 极端测试-下半单周 | 周五 7-8节 | 下半学期 | 单周 |
| TEST-EXTREME-4 | 极端测试-下半双周 | 周五 9-11节 | 下半学期 | 双周 |

## 效果

- ✅ 课程块的轮廓、阴影、hover效果都只显示在实际上课的区域
- ✅ 不上课的区域完全透明，显示为背景色（白色）
- ✅ 鼠标交互只在可见区域生效
- ✅ 覆盖所有 8 种切分情况（4种单一 + 4种组合）

## 测试方法

```bash
cd app
npm run dev
```

访问课程表面板，观察周四和周五的测试课程块形状。
