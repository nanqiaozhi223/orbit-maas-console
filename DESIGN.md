---
name: MaaS 控制台
description: 白绿轻拟物的模型服务后台组件规范
colors:
  brand: "#a3e635"
  brand-strong: "#84cc16"
  brand-deep: "#4d7c0f"
  brand-text: "#3f6212"
  page: "#f4f5f7"
  surface-start: "#fafbfd"
  surface-end: "#f0f2f6"
  control: "#f2f4f7"
  text: "#0f172a"
  text-strong: "#475569"
  text-muted: "#526174"
  text-input: "#334155"
  text-legacy: "#64748b"
  status-off: "#94a3b8"
  business: "#92400e"
  business-muted: "#fef3c7"
  office-muted: "#e9f8cb"
  border: "#e5e7eb"
  dark: "#18181b"
  white: "#ffffff"
  success: "#65a30d"
  warning: "#a16207"
  danger: "#dc2626"
typography:
  title:
    fontFamily: "Avenir Next, SF Pro Display, PingFang SC, Microsoft YaHei, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Avenir Next, SF Pro Display, PingFang SC, Microsoft YaHei, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  compact:
    fontFamily: "Avenir Next, SF Pro Display, PingFang SC, Microsoft YaHei, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Avenir Next, SF Pro Display, PingFang SC, Microsoft YaHei, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.4
  micro:
    fontFamily: "Avenir Next, SF Pro Display, PingFang SC, Microsoft YaHei, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.4
  section:
    fontFamily: "Avenir Next, SF Pro Display, PingFang SC, Microsoft YaHei, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.35
rounded:
  bar-top: "3px"
  xs: "8px"
  sm: "10px"
  action: "12px"
  choice: "14px"
  md: "16px"
  surface: "24px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  base: "16px"
  module: "20px"
  section: "24px"
  gutter: "32px"
components:
  button-primary:
    backgroundColor: "{colors.dark}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    height: "42px"
    padding: "0 20px"
  button-secondary:
    backgroundColor: "{colors.surface-start}"
    textColor: "{colors.text-strong}"
    rounded: "{rounded.pill}"
    height: "42px"
    padding: "0 16px"
  button-danger:
    backgroundColor: "{colors.surface-start}"
    textColor: "{colors.danger}"
    rounded: "{rounded.pill}"
    height: "42px"
    padding: "0 16px"
  card:
    backgroundColor: "{colors.surface-start}"
    textColor: "{colors.text}"
    rounded: "{rounded.surface}"
    padding: "22px"
---

# MaaS 控制台设计系统

## Overview

定位为高密度、可快速扫描的后台操作界面。浅灰白底承载内容，荧光绿标识品牌、选中与成功状态；深色仅用于主要操作和代码区。主要信息模块使用克制的轻拟物高光与柔和阴影。代码中的 `assets/design-system.css` 是令牌和共用组件的来源，`assets/api-keys.css` 仅处理 API Key 业务组件。

## Colors

- 品牌：`#A3E635`、`#84CC16`；深绿 `#4D7C0F` 用于强调文字。
- 页面：`#F4F5F7`；面板渐变从 `#FAFBFD` 至 `#F0F2F6`；内凹控件 `#F2F4F7`。
- 正文：`#0F172A`；次级文字 `#475569`；辅助信息与占位文字统一使用 `#526174`。遗留的 `#64748B` 仅作为迁移中的兼容色。
- 状态：成功 `#65A30D`、警示 `#A16207`、危险 `#DC2626`。颜色总与文字或形状共同表达状态。
- 绿色大面积背景仅用于概览页快速操作卡。办公/业务场景徽章可用浅绿/浅黄，避免引入第二品牌色。
- 暗色主题：页面底色 `#080A10`，侧栏 `#0D111A`，面板渐变 `#151A26` 至 `#101521`，边框 `#273043`，正文 `#F8FAFC`，辅助文字 `#94A3B8`；品牌绿保持不变。通过顶栏按钮切换，偏好以 `maas-theme` 保存。

## Typography

- 页面主标题 20px；卡片标题 16px；正文 14px；密集信息 13px；辅助与表格标题 12px。窄表格中可用 11px，但交互文本不得低于 11px。
- 主体使用系统无衬线字体栈；API Key、代码示例使用等宽字体。数字尽量采用等宽数字特性。
- 同一组件内用字号、颜色和间距表达层级，避免同时加重字重和增加装饰。模型选择列表中的名称、提供方和类型标签均为 400 字重。

## Layout

- 桌面侧栏 218px，1050px 以下折叠为 86px，760px 以下使用底部导航。
- 顶栏高 56px，默认透明；页面滚动后使用半透明模糊遮盖。
- 桌面内容边距 32px，模块间距 20px；移动端内容边距和模块间距 16px。
- API Key 九列表格在宽桌面完整显示；1180px 以下转分组行排版，不依赖横向滚动。
- 表单字段桌面两列、移动端单列；弹窗可内部纵向滚动，操作区始终位于内容末端。

## Elevation & Depth

- 普通卡片使用浅灰渐变、左上高光、右下柔和阴影及内侧亮边；统一引用 `--ui-shadow-surface`。
- 小按钮和图标按钮使用 `--ui-shadow-raised`；搜索与输入控件使用 `--ui-shadow-inset`。
- 主要深色按钮使用 `--ui-shadow-dark`。阴影用于表达层级，不叠加额外彩色光晕。

## Shapes

- 主要模块和弹窗约 24px 圆角；选择卡片与模型池面板约 14–16px；表单控件约 10px；导航、搜索和主要操作按钮为胶囊形。12px 用于局部次要按钮，3px 仅用于柱状图底边。
- 同一个展开组件只有一条连续外边框；内部内容使用分隔线，不嵌套第二个同等权重的矩形框。

## Components

- **导航**：用户提供的面性 SVG，使用 `currentColor`；选中项为浅绿底与深绿文字，悬停增强文字对比。
- **卡片**：`.card` 为普通面板，`.stat` 为指标摘要，`.quick` 为唯一的大面积绿色强调面板。
- **按钮**：主要操作深色胶囊按钮；次要操作浅灰凸起按钮；危险操作使用红色文字与细边框。小范围绿色按钮仅在品牌语义明确时使用。
- **输入与筛选**：浅灰内凹表面；聚焦使用绿色焦点环；占位文字使用 `--ui-text-placeholder`。
- **表格**：表头与卡片同底色，细分隔线划分数据；场景、状态使用文字与色彩共同表达；行操作按钮为 12px。
- **弹窗**：与普通卡片同材质，半透明深色遮罩；创建成功仅展示一次完整 Key，列表显示脱敏值。
- **模型配置**：场景卡、路由卡、单选模型列表保持同一选中规则；自定义模型池展开后与开关形成连续面板。
- **公告**：一列文字列表，左侧状态点、右侧时间，内容用细线分隔。
- **用量汇总与图表**：五项指标各自使用独立轻拟物卡片；模型指标表数字右对齐，表头使用用户提供的双三角排序图标；原生 SVG 图表只使用既有绿与中性灰。统计值为演示数据时在页面显式标注。
- **模块分隔线**：在卡片内容边距内起止，与标题和表格内容的左右边线对齐，不接触模块外边缘。

## Do's and Don'ts

- Do：优先使用 `--ui-*` 令牌和现有组件类，再补充业务组件样式。
- Do：在桌面、折叠侧栏、移动端检查表格、弹窗与操作按钮的可用性。
- Don't：引入紫色控制台主题、自制仿 Iconfont 图标或未提供来源的装饰图标。
- Don't：让低对比度浅灰承担正文、占位或操作标签。
