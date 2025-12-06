# 课程表切分显示测试

## 需求

课程表中的课程块需要根据 `weekSpan`（上半/下半学期）和 `weekParity`（单周/双周）进行视觉切分，**不显示的区域应显示为白色**，而非调色。

## 实现方案

使用 CSS `clip-path` 直接裁剪课程块的形状，使得轮廓、hover效果和阴影都只显示在实际上课的区域。

### 1. 单一切分情况

- **上半学期**：显示上半部分矩形
  - `clip-path: polygon(0 0, 100% 0, 100% 50%, 0 50%)`
  
- **下半学期**：显示下半部分矩形
  - `clip-path: polygon(0 50%, 100% 50%, 100% 100%, 0 100%)`

- **单周**：显示左半部分矩形
  - `clip-path: polygon(0 0, 50% 0, 50% 100%, 0 100%)`
  
- **双周**：显示右半部分矩形
  - `clip-path: polygon(50% 0, 100% 0, 100% 100%, 50% 100%)`

### 2. 极端组合情况（同时存在学期切分和单双周切分）

- **上半学期 + 单周**：左上角三角形
  - `clip-path: polygon(0 0, 100% 0, 0 100%)`
  
- **上半学期 + 双周**：右上角三角形
  - `clip-path: polygon(0 0, 100% 0, 100% 100%)`

- **下半学期 + 单周**：左下角三角形
  - `clip-path: polygon(0 0, 0 100%, 100% 100%)`
  
- **下半学期 + 双周**：右下角三角形
  - `clip-path: polygon(100% 0, 100% 100%, 0 100%)`

### 3. 效果特点

- 课程块的轮廓、阴影、hover效果都会被裁剪
- 不上课的区域完全透明，显示为背景色（白色）
- 鼠标hover只在可见区域生效

## 测试用例

在 `app/src/lib/data/demo/sampleCourses.ts` 中添加了 4 个极端测试用例，覆盖所有组合：

| ID | 课程名称 | 位置 | weekSpan | weekParity | 视觉效果 |
|----|---------|------|----------|-----------|---------|
| TEST-EXTREME-1 | 极端测试-上半单周 | 周四 7-8节 | 上半学期 | 单周 | 左上角三角形 |
| TEST-EXTREME-2 | 极端测试-上半双周 | 周四 9-10节 | 上半学期 | 双周 | 右上角三角形 |
| TEST-EXTREME-3 | 极端测试-下半单周 | 周五 7-8节 | 下半学期 | 单周 | 左下角三角形 |
| TEST-EXTREME-4 | 极端测试-下半双周 | 周五 9-11节 | 下半学期 | 双周 | 右下角三角形 |

## 验证方法

1. 启动开发服务器：
   ```bash
   cd app
   npm run dev
   ```

2. 打开浏览器访问课程表面板

3. 观察周四和周五的测试课程块：
   - 每个课程块应该有基础颜色
   - 不上课的区域应该显示为白色三角形
   - 同时存在学期切分和单双周切分时，应该看到两个白色三角形叠加

## 技术细节

### 实现逻辑

通过 `getClipPath()` 函数根据 `weekSpan` 和 `weekParity` 的组合计算出对应的 `clip-path` 值，直接应用到课程块的 `style` 属性上。

### 关键代码

```typescript
function getClipPath(entry: DemoCalendarEntry): string {
  const hasSpanUpper = entry.weekSpan === '上半学期';
  const hasSpanLower = entry.weekSpan === '下半学期';
  const hasParityOdd = entry.weekParity === '单周';
  const hasParityEven = entry.weekParity === '双周';

  // 四种极端组合情况
  if (hasSpanUpper && hasParityOdd) return 'polygon(0 0, 100% 0, 0 100%)';
  if (hasSpanUpper && hasParityEven) return 'polygon(0 0, 100% 0, 100% 100%)';
  if (hasSpanLower && hasParityOdd) return 'polygon(0 0, 0 100%, 100% 100%)';
  if (hasSpanLower && hasParityEven) return 'polygon(100% 0, 100% 100%, 0 100%)';

  // 单一切分情况
  if (hasSpanUpper) return 'polygon(0 0, 100% 0, 100% 50%, 0 50%)';
  if (hasSpanLower) return 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)';
  if (hasParityOdd) return 'polygon(0 0, 50% 0, 50% 100%, 0 100%)';
  if (hasParityEven) return 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)';

  return 'none';
}
```

### CSS 样式

```css
.course-block {
  background-color: var(--base-color);
  /* clip-path 通过 style 属性动态设置 */
}
```

## 预期效果图示

```
上半学期 + 单周 (TEST-EXTREME-1) - 左上角三角形:
┌─────────────┐
│████████████░│  
│████████░░░░░│  ░ = 透明（不上课）
│████░░░░░░░░░│  
└─────────────┘
实际显示：
████████████
████████
████

上半学期 + 双周 (TEST-EXTREME-2) - 右上角三角形:
┌─────────────┐
│████████████░│  
│░░░░████████░│  
│░░░░░░░░████░│  
└─────────────┘
实际显示：
████████████
    ████████
        ████

下半学期 + 单周 (TEST-EXTREME-3) - 左下角三角形:
┌─────────────┐
│░░░░░░░░████░│  
│░░░░████████░│  
│████████████░│  
└─────────────┘
实际显示：
        ████
    ████████
████████████

下半学期 + 双周 (TEST-EXTREME-4) - 右下角三角形:
┌─────────────┐
│░████░░░░░░░░│  
│░████████░░░░│  
│░████████████│  
└─────────────┘
实际显示：
 ████
 ████████
 ████████████
```

## 注意事项

1. `clip-path` 会裁剪整个元素，包括边框、阴影和 hover 效果
2. 鼠标交互区域也会被裁剪，只在可见区域响应
3. 课程文字会随着块的形状被裁剪，需要确保文字位置合理
4. 所有切分效果通过动态计算 `clip-path` 实现，在 `buildBlockStyle()` 中完成
5. 极端情况下（三角形），文字可能需要调整位置以适应三角形区域
