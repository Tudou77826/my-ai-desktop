# ClaudeCode Config Manager - UI/UX 设计书 v1.0

**项目名称**: ClaudeCode 配置可视化管理工具
**设计日期**: 2026-02-05
**设计风格**: 温暖灰色调 + Claude Desktop 垂直侧边栏布局
**技术栈**: Tauri + React + TypeScript + Tailwind CSS + shadcn/ui

---

## 一、设计理念与原则

### 1.1 核心设计哲学

```
专业 · 温暖 · 高效 · 可信
```

- **专业**: 干净利落的界面，体现开发者工具的专业性
- **温暖**: 使用温暖灰色调，避免冰冷的技术感
- **高效**: Claude Desktop 风格的垂直侧边栏，快速切换功能
- **可信**: 清晰的视觉反馈，让用户对配置修改充满信心

### 1.2 设计原则

| 原则 | 说明 | 实现方式 |
|------|------|----------|
| **极简优先** | 去除一切不必要的装饰 | 使用卡片式布局，留白充足 |
| **信息分层** | 重要信息优先展示 | 使用字体大小、颜色深浅区分层级 |
| **操作反馈** | 每个操作都有明确反馈 | Toast 通知、Loading 状态、Hover 效果 |
| **错误宽容** | 修改前预览，支持撤销 | Diff 预览对话框、自动备份 |
| **快速响应** | 启动 < 3秒，操作 < 500ms | 优化加载、缓存数据、懒渲染 |

---

## 二、色彩系统 - 温暖灰色调

### 2.1 主色调 (Warm Gray Palette)

```css
/* ===== 温暖灰色彩系统 ===== */

/* 主色 - 温暖中性灰 */
--gray-50:  #FAFAF9;   /* 最浅背景 */
--gray-100: #F5F5F4;   /* 次级背景 */
--gray-200: #E7E5E4;   /* 边框、分割线 */
--gray-300: #D6D3D1;   /* 禁用状态边框 */
--gray-400: #A8A29E;   /* 次要文本 */
--gray-500: #78716C;   /* 辅助文本 */
--gray-600: #57534E;   /* 正文文本 */
--gray-700: #44403C;   /* 标题文本 */
--gray-800: #292524;   /* 深色背景 */
--gray-900: #1C1917;   /* 最深背景 */

/* 温暖强调色 */
--accent-amber:   #D97706;  /* 主要操作按钮 */
--accent-amber-light: #F59E0B; /* Hover 状态 */
--accent-orange:  #EA580C;  /* 警告/危险操作 */

/* 功能色 */
--success-green: #16A34A; /* 成功状态 */
--error-red:     #DC2626; /* 错误状态 */
--warning-yellow:#CA8A04; /* 警告状态 */
--info-blue:     #0284C7; /* 信息提示 */

/* 特殊效果色 */
--glass-bg-light: rgba(255, 255, 255, 0.85);
--glass-bg-dark:  rgba(28, 25, 23, 0.85);
--shadow-sm:  0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md:  0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg:  0 10px 15px -3px rgba(0, 0, 0, 0.1);
```

### 2.2 语义化色彩映射

| UI 元素 | 浅色模式 | 深色模式 | 用途 |
|---------|---------|---------|------|
| **背景** | `#FAFAF9` (gray-50) | `#1C1917` (gray-900) | 页面主背景 |
| **卡片背景** | `#FFFFFF` | `#292524` (gray-800) | 卡片、容器 |
| **侧边栏** | `#F5F5F4` (gray-100) | `#292524` (gray-800) | 导航栏背景 |
| **边框** | `#E7E5E4` (gray-200) | `#44403C` (gray-700) | 分割线 |
| **主文本** | `#1C1917` (gray-900) | `#FAFAF9` (gray-50) | 标题、重要内容 |
| **次文本** | `#57534E` (gray-600) | `#A8A29E` (gray-400) | 正文、说明 |
| **辅助文本** | `#78716C` (gray-500) | `#78716C` (gray-500) | 时间戳、标签 |
| **主按钮** | `#D97706` (amber-600) | `#F59E0B` (amber-500) | 主要操作 |
| **主按钮文字** | `#FFFFFF` | `#1C1917` (gray-900) | 按钮文字 |

### 2.3 状态色彩

```css
/* 状态指示器颜色 */
.status-online    { background: #16A34A; } /* MCP 在线 */
.status-offline   { background: #78716C; } /* MCP 离线 */
.status-error     { background: #DC2626; } /* 错误 */
.status-warning   { background: #CA8A04; } /* 警告 */
.status-loading   { background: #0284C7; } /* 加载中 */
```

---

## 三、布局系统 - Claude Desktop 风格

### 3.1 整体布局结构

```
┌────────────────────────────────────────────────────────────┐
│  🔍 ClaudeCode Config Manager              [🔄] [⚙️] [🌙]  │ ← 顶部导航栏 (56px)
├──────────┬─────────────────────────────────────────────────┤
│          │                                                 │
│   📊     │         主内容区域                              │
│   概览   │         (动态内容区)                            │
│          │                                                 │
│   🧩     │                                                 │
│ Skills  │                                                 │
│          │                                                 │
│   🔌     │                                                 │
│   MCP    │         内容随侧边栏选择动态变化                │
│          │                                                 │
│   📁     │                                                 │
│  项目    │                                                 │
│          │                                                 │
│   📝     │                                                 │
│  配置    │                                                 │
│          │                                                 │
└──────────┴─────────────────────────────────────────────────┘
    ↑                        ↑
  侧边栏                   内容区
  (240px)                (剩余宽度)
```

### 3.2 侧边栏设计 (垂直导航)

#### 侧边栏特性

```typescript
// 侧边栏规格
const sidebarSpec = {
  width: '240px',           // 固定宽度
  position: 'fixed',         // 固定定位
  left: 0,                   // 左对齐
  top: '56px',              // 顶部导航栏下方
  bottom: 0,                 // 延伸到底部
  background: 'gray-100',    // 浅色模式: #F5F5F4
  backgroundDark: 'gray-800', // 深色模式: #292524
  borderRight: '1px solid gray-200',
  overflowY: 'auto',         // 内容过多时可滚动
  zIndex: 10,                // 确保在内容区上方
};

// 导航项规格
const navItemSpec = {
  height: '48px',            // 每项高度
  paddingX: '16px',          // 左右内边距
  display: 'flex',
  alignItems: 'center',
  gap: '12px',               // 图标与文字间距
  borderRadius: '6px',       // 圆角
  marginX: '8px',            // 左右外边距
  cursor: 'pointer',
  transition: 'all 150ms ease',
};
```

#### 导航项样式

```css
/* 未选中状态 */
.nav-item {
  color: #57534E; /* gray-600 */
  background: transparent;
}

.nav-item:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #1C1917; /* gray-900 */
}

/* 选中状态 (Active) */
.nav-item.active {
  background: #D97706; /* amber-600 */
  color: #FFFFFF;
  font-weight: 500;
}

.nav-item.active:hover {
  background: #B45309; /* amber-700 */
}

/* 深色模式 */
.dark .nav-item {
  color: #A8A29E; /* gray-400 */
}

.dark .nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #FAFAF9;
}

.dark .nav-item.active {
  background: #F59E0B; /* amber-500 */
  color: #1C1917;
}
```

### 3.3 顶部导航栏

```typescript
// 顶部导航栏规格
const headerSpec = {
  height: '56px',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  background: 'glass',      // 玻璃态效果
  backdropBlur: '12px',
  borderBottom: '1px solid gray-200',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingX: '24px',
  zIndex: 20,                // 高于侧边栏
};
```

### 3.4 内容区域

```typescript
// 内容区规格
const contentSpec = {
  marginLeft: '240px',       // 侧边栏宽度
  marginTop: '56px',         // 顶部导航栏高度
  minHeight: 'calc(100vh - 56px)',
  padding: '24px',           // 统一内边距
  background: 'gray-50',     // 浅色模式: #FAFAF9
  backgroundDark: 'gray-900', // 深色模式: #1C1917
};
```

---

## 四、字体系统

### 4.1 字体选择

```css
/* ===== 字体家族 ===== */

/* 主字体 - 系统原生字体 (最佳性能) */
--font-sans:
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  Roboto,
  "Helvetica Neue",
  Arial,
  "Noto Sans",
  sans-serif;

/* 代码字体 */
--font-mono:
  "SF Mono",
  Monaco,
  "Cascadia Code",
  "Roboto Mono",
  "Courier New",
  monospace;
```

### 4.2 字体大小与行高

```css
/* ===== 字体大小规范 ===== */

/* 标题 */
--text-4xl: 2.25rem;   /* 36px - 页面主标题 */
--text-3xl: 1.875rem;  /* 30px - 区块标题 */
--text-2xl: 1.5rem;    /* 24px - 卡片标题 */
--text-xl:  1.25rem;   /* 20px - 次级标题 */
--text-lg:  1.125rem;  /* 18px - 大号正文 */

/* 正文 */
--text-base: 1rem;     /* 16px - 标准正文 */
--text-sm:   0.875rem; /* 14px - 小号文本 */
--text-xs:   0.75rem;  /* 12px - 辅助文本 */

/* 行高 */
--leading-tight:   1.25;  /* 标题 */
--leading-normal:  1.5;   /* 正文 */
--leading-relaxed: 1.625; /* 长文本 */
```

### 4.3 字重规范

```css
/* ===== 字重规范 ===== */

--font-normal:  400;  /* 正文 */
--font-medium:  500;  /* 强调文本、按钮 */
--font-semibold: 600; /* 小标题 */
--font-bold:    700;  /* 主标题 */
```

### 4.4 使用场景

| 元素 | 字体大小 | 字重 | 行高 | 颜色 |
|------|---------|------|------|------|
| **页面标题** | 30px (text-3xl) | Bold (700) | 1.25 | gray-900 |
| **卡片标题** | 18px (text-lg) | Semibold (600) | 1.25 | gray-700 |
| **导航项** | 14px (text-sm) | Medium (500) | 1.5 | gray-600 |
| **正文** | 14px (text-sm) | Normal (400) | 1.5 | gray-600 |
| **辅助文本** | 12px (text-xs) | Normal (400) | 1.5 | gray-500 |
| **按钮** | 14px (text-sm) | Medium (500) | 1.5 | white |
| **代码** | 13px (text-xs) | Normal (400) | 1.5 | gray-600 |

---

## 五、间距与布局规范

### 5.1 间距系统 (8px 基准)

```css
/* ===== 间距系统 ===== */

--spacing-0:   0;
--spacing-1:   0.25rem;  /* 4px */
--spacing-2:   0.5rem;   /* 8px  - 最小单元 */
--spacing-3:   0.75rem;  /* 12px */
--spacing-4:   1rem;     /* 16px - 标准间距 */
--spacing-5:   1.25rem;  /* 20px */
--spacing-6:   1.5rem;   /* 24px - 卡片间距 */
--spacing-8:   2rem;     /* 32px - 区块间距 */
--spacing-10:  2.5rem;   /* 40px */
--spacing-12:  3rem;     /* 48px - 页面级间距 */
--spacing-16:  4rem;     /* 64px */
--spacing-20:  5rem;     /* 80px */
```

### 5.2 卡片布局

```typescript
// 标准卡片规格
const cardSpec = {
  background: 'white',
  borderRadius: '8px',
  border: '1px solid gray-200',
  padding: '20px',        // p-5
  boxShadow: 'sm',
  transition: 'all 150ms ease',
};

// 悬浮效果
const cardHoverSpec = {
  boxShadow: 'md',
  transform: 'translateY(-2px)',
};

// 可点击卡片
const clickableCardSpec = {
  ...cardSpec,
  cursor: 'pointer',
};

clickableCardSpec[':hover'] = {
  ...cardHoverSpec,
  borderColor: 'gray-300',
};
```

### 5.3 常见布局模式

#### 统计卡片网格

```tsx
// 4列统计卡片
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard label="Skills" value="12" />
  <StatCard label="MCP" value="5" />
  <StatCard label="项目" value="8" />
  <StatCard label="配置" value="24" />
</div>
```

#### 列表项布局

```tsx
// 标准 Skill/MCP 列表项
<div className="
  flex items-center justify-between
  p-4 border-b border-gray-200
  hover:bg-gray-50
  transition-colors duration-150
">
  <div className="flex items-center gap-3">
    <Icon />
    <div>
      <div className="font-medium text-gray-900">标题</div>
      <div className="text-sm text-gray-500">描述</div>
    </div>
  </div>
  <div className="flex items-center gap-2">
    <Switch />
    <Button>操作</Button>
  </div>
</div>
```

---

## 六、组件设计规范

### 6.1 按钮

```css
/* ===== 主按钮 ===== */

.btn-primary {
  background: #D97706;      /* amber-600 */
  color: #FFFFFF;
  padding: 8px 16px;        /* py-2 px-4 */
  borderRadius: 6px;
  fontWeight: 500;
  fontSize: 14px;
  transition: 'all 150ms ease';
  cursor: pointer;
}

.btn-primary:hover {
  background: #B45309;      /* amber-700 */
}

.btn-primary:active {
  transform: 'scale(0.98)';
}

/* 次按钮 */
.btn-secondary {
  background: white;
  color: #57534E;           /* gray-600 */
  border: 1px solid #E7E5E4; /* gray-200 */
}

.btn-secondary:hover {
  background: #FAFAF9;      /* gray-50 */
  borderColor: #D6D3D1;     /* gray-300 */
}

/* 幽灵按钮 */
.btn-ghost {
  background: transparent;
  color: #57534E;
}

.btn-ghost:hover {
  background: rgba(0, 0, 0, 0.05);
}

/* 危险按钮 */
.btn-danger {
  background: #DC2626;      /* red-600 */
  color: white;
}

.btn-danger:hover {
  background: #B91C1C;      /* red-700 */
}
```

### 6.2 开关 (Switch)

```tsx
// Switch 组件规格
const switchSpec = {
  width: '44px',            // w-11
  height: '24px',           // h-6
  borderRadius: '12px',     // rounded-full
  background: 'gray-300',   // 未选中: gray-300
  transition: 'all 200ms ease',
  cursor: 'pointer',
  position: 'relative',
};

// 选中状态
.switchChecked {
  background: '#D97706';    // amber-600
}

// 圆点
.switchThumb = {
  width: '18px',
  height: '18px',
  borderRadius: '50%',
  background: 'white',
  position: 'absolute',
  top: '3px',
  left: '3px',
  transition: 'all 200ms ease',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
};

// 选中时圆点位置
.switchChecked .switchThumb {
  transform: 'translateX(20px)';
}
```

### 6.3 输入框

```css
/* ===== 输入框 ===== */

.input {
  width: 100%;
  padding: 8px 12px;        /* py-2 px-3 */
  borderRadius: 6px;
  border: 1px solid #E7E5E4; /* gray-200 */
  fontSize: 14px;
  color: #1C1917;           /* gray-900 */
  background: white;
  transition: 'all 150ms ease',
}

.input:focus {
  outline: 'none';
  borderColor: '#D97706';   /* amber-600 */
  boxShadow: '0 0 0 3px rgba(217, 119, 6, 0.1)';
}

.input::placeholder {
  color: #A8A29E;           /* gray-400 */
}

.input:disabled {
  background: #FAFAF9;      /* gray-50 */
  color: #78716C;           /* gray-500 */
  cursor: 'not-allowed';
}
```

### 6.4 标签 (Badge)

```css
/* ===== 状态标签 ===== */

.badge {
  display: 'inline-flex';
  alignItems: 'center',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 500,
}

.badge-success {
  background: '#DCFCE7';    /* green-100 */
  color: '#16A34A';         /* green-600 */
}

.badge-warning {
  background: '#FEF9C3';    /* yellow-100 */
  color: '#CA8A04';         /* yellow-600 */
}

.badge-error {
  background: '#FEE2E2';    /* red-100 */
  color: '#DC2626';         /* red-600 */
}

.badge-neutral {
  background: '#F5F5F4';    /* gray-100 */
  color: #57534E;           /* gray-600 */
}
```

### 6.5 对话框 (Dialog)

```tsx
// Dialog 规格
const dialogSpec = {
  background: 'white',
  borderRadius: '12px',
  maxWidth: '600px',
  width: '90%',
  maxHeight: '85vh',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
};

// Dialog 头部
.dialogHeader = {
  padding: '20px 24px',
  borderBottom: '1px solid gray-200',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

// Dialog 内容
.dialogBody = {
  padding: '24px',
  overflowY: 'auto',
  maxHeight: 'calc(85vh - 140px)',
};

// Dialog 底部
.dialogFooter = {
  padding: '16px 24px',
  borderTop: '1px solid gray-200',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
};
```

### 6.6 Toast 通知

```css
/* ===== Toast 通知 ===== */

.toast {
  display: 'flex';
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  borderRadius: '8px',
  background: 'white',
  border: '1px solid gray-200',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  fontSize: '14px',
  animation: 'slideIn 300ms ease',
}

@keyframes slideIn {
  from {
    transform: 'translateX(100%)',
    opacity: 0,
  }
  to {
    transform: 'translateX(0)',
    opacity: 1,
  }
}

.toast-success {
  borderLeft: '4px solid #16A34A'; /* green-600 */
}

.toast-error {
  borderLeft: '4px solid #DC2626'; /* red-600 */
}

.toast-warning {
  borderLeft: '4px solid #CA8A04'; /* yellow-600 */
}
```

---

## 七、页面详细设计

### 7.1 概览页面 (Dashboard)

```tsx
// 布局结构
<div className="content-area">
  <PageHeader
    title="配置概览"
    subtitle="管理您的 ClaudeCode 配置"
    actions={<RefreshButton />}
  />

  {/* 统计卡片 */}
  <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <StatCard
      icon={<CubeIcon />}
      label="Skills"
      value={data.skills.length}
      trend="+2 本周"
      color="amber"
    />
    <StatCard
      icon={<PlugIcon />}
      label="MCP 服务器"
      value={data.mcpServers.length}
      status="5 在线"
      color="blue"
    />
    <StatCard
      icon={<FolderIcon />}
      label="项目"
      value={data.projects.length}
      active="3 活跃"
      color="green"
    />
    <StatCard
      icon={<DocumentIcon />}
      label="配置文件"
      value={data.configFiles.length}
      modified="2 已修改"
      color="purple"
    />
  </section>

  {/* 健康状态 */}
  <section className="mb-6">
    <Card>
      <CardHeader>
        <CardTitle>配置健康状态</CardTitle>
      </CardHeader>
      <CardContent>
        <StatusItem icon="✓" text="所有配置文件格式有效" status="success" />
        <StatusItem icon="!" text="2个MCP服务器未测试连接" status="warning" />
        <StatusItem icon="ℹ" text="最后检查: 5分钟前" status="info" />
      </CardContent>
    </Card>
  </section>

  {/* 最近项目 */}
  <section>
    <Card>
      <CardHeader>
        <CardTitle>最近使用的项目</CardTitle>
      </CardHeader>
      <CardContent>
        <ProjectList projects={recentProjects} />
      </CardContent>
    </Card>
  </section>
</div>
```

### 7.2 Skills 管理页面

```tsx
// 布局结构
<div className="content-area">
  <PageHeader
    title="Skills 管理"
    actions={
      <>
        <Button variant="secondary">安装 Skill</Button>
        <Button variant="primary">刷新</Button>
      </>
    }
  />

  {/* 筛选栏 */}
  <FilterBar
    filters={['全部', '已启用', '全局', '项目']}
    searchPlaceholder="搜索 Skills..."
  />

  {/* Skills 列表 */}
  <section className="space-y-4">
    {/* 全局 Skills */}
    <div>
      <SectionHeader title="全局 Skills" icon={<GlobeIcon />} />
      <div className="space-y-2">
        {globalSkills.map(skill => (
          <SkillListItem
            key={skill.id}
            skill={skill}
            onToggle={handleToggle}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>

    {/* 项目 Skills */}
    <div>
      <SectionHeader title="项目 Skills" icon={<FolderIcon />} />
      <div className="space-y-2">
        {projectSkills.map(skill => (
          <SkillListItem
            key={skill.id}
            skill={skill}
            scopeBadge="my-react-app"
          />
        ))}
      </div>
    </div>
  </section>
</div>

// Skill 列表项组件
<SkillListItem>
  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
    <div className="flex items-center gap-3">
      {/* 图标 */}
      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
        <CubeIcon className="w-5 h-5 text-amber-600" />
      </div>

      {/* 信息 */}
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">commit</h3>
          {skill.enabled && (
            <Badge variant="success">已启用</Badge>
          )}
        </div>
        <p className="text-sm text-gray-500">Git提交管理</p>
        <p className="text-xs text-gray-400">路径: ~/.claude/skills/commit</p>
      </div>
    </div>

    {/* 操作区 */}
    <div className="flex items-center gap-2">
      <Switch checked={skill.enabled} onCheckedChange={(checked) => onToggle(skill.id, checked)} />
      <Button variant="ghost" size="sm" onClick={() => onViewDetails(skill)}>
        <EyeIcon className="w-4 h-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuItem onClick={() => onEdit(skill)}>编辑 SKILL.md</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onOpenFolder(skill)}>打开文件夹</DropdownMenuItem>
        <DropdownMenuItem variant="danger" onClick={() => onDelete(skill)}>删除</DropdownMenuItem>
      </DropdownMenu>
    </div>
  </div>
</SkillListItem>
```

### 7.3 MCP 服务器页面

```tsx
// MCP 列表项组件
<div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
  <div className="flex items-center gap-3">
    {/* 服务器图标 */}
    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
      <ServerIcon className="w-5 h-5 text-blue-600" />
    </div>

    {/* 信息 */}
    <div>
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-gray-900">{server.name}</h3>
        <StatusBadge status={server.health?.status} />
        {server.transport && (
          <Badge variant="neutral">{server.transport.toUpperCase()}</Badge>
        )}
      </div>
      <p className="text-sm text-gray-500">{server.description}</p>
      {server.health?.status === 'ok' && (
        <p className="text-xs text-green-600">响应时间: {server.health.latency}ms</p>
      )}
    </div>
  </div>

  {/* 操作区 */}
  <div className="flex items-center gap-2">
    <Button variant="secondary" size="sm" onClick={() => onTestConnection(server)}>
      测试连接
    </Button>
    <Switch checked={server.enabled} />
    <Button variant="ghost" size="sm">
      <MoreVerticalIcon className="w-4 h-4" />
    </Button>
  </div>
</div>

// 状态指示器
<StatusBadge status="ok" />
// 渲染: <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
//         <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
//         在线
//       </span>
```

### 7.4 项目管理页面

```tsx
// 项目卡片
<ProjectCard>
  <div className="p-5 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all">
    {/* 头部 */}
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
          <FolderIcon className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{project.name}</h3>
          <p className="text-xs text-gray-500">{project.type}</p>
        </div>
      </div>
      <DropdownMenu>
        <Button variant="ghost" size="sm">
          <MoreVerticalIcon className="w-4 h-4" />
        </Button>
      </DropdownMenu>
    </div>

    {/* 信息 */}
    <div className="space-y-2 mb-4">
      <InfoRow icon={<FolderIcon />} label={project.path} />
      <InfoRow icon={<ClockIcon />} label={`最后访问: ${formatTime(project.lastAccessed)}`} />
    </div>

    {/* 配置概览 */}
    <div className="border-t border-gray-200 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-gray-500 mb-1">Skills</div>
          <div className="flex flex-wrap gap-1">
            {project.skills.map(skill => (
              <Badge key={skill} variant="neutral" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">MCP 服务器</div>
          <div className="flex flex-wrap gap-1">
            {project.mcpServers.map(server => (
              <Badge key={server} variant="neutral" className="text-xs">
                {server}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* 操作按钮 */}
    <div className="flex gap-2 mt-4">
      <Button variant="secondary" size="sm" className="flex-1">
        查看配置
      </Button>
      <Button variant="ghost" size="sm">
        <CodeIcon className="w-4 h-4 mr-1" />
        打开 CLAUDE.md
      </Button>
    </div>
  </div>
</ProjectCard>
```

### 7.5 配置编辑器页面

```tsx
// 配置编辑器布局
<div className="flex h-[calc(100vh-56px)]">
  {/* 左侧文件树 */}
  <div className="w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto">
    <div className="p-4 border-b border-gray-200">
      <h2 className="font-semibold text-gray-900">配置文件</h2>
    </div>
    <FileTree
      files={configFiles}
      selectedFile={selectedFile}
      onSelect={setSelectedFile}
    />
  </div>

  {/* 右侧编辑器 */}
  <div className="flex-1 flex flex-col">
    {/* 编辑器头部 */}
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-2">
        <DocumentIcon className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-900">{selectedFile.path}</span>
        {selectedFile.modified && (
          <Badge variant="warning">已修改</Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        {validation.isValid && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <CheckIcon className="w-3 h-3" />
            JSON 有效
          </span>
        )}
        <Button variant="secondary" size="sm" onClick={handleCopy}>
          复制
        </Button>
        <Button variant="primary" size="sm" onClick={handleSave}>
          保存
        </Button>
      </div>
    </div>

    {/* Monaco Editor */}
    <div className="flex-1">
      <MonacoEditor
        height="100%"
        language={selectedFile.format}
        value={selectedFile.content}
        onChange={handleChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  </div>
</div>
```

---

## 八、交互设计规范

### 8.1 Hover 效果

```css
/* 可点击元素必须有 hover 状态 */

.clickable {
  cursor: pointer;
  transition: all 150ms ease;
}

/* 卡片 hover */
.card-hover:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-color: #D6D3D1; /* gray-300 */
}

/* 按钮 hover */
.btn-primary:hover {
  background: #B45309; /* amber-700 */
}

/* 链接 hover */
.link:hover {
  color: #D97706; /* amber-600 */
}

/* 列表项 hover */
.list-item:hover {
  background: #FAFAF9; /* gray-50 */
}
```

### 8.2 Focus 状态 (无障碍)

```css
/* 所有交互元素必须有明显的 focus 状态 */

:focus-visible {
  outline: 2px solid #D97706; /* amber-600 */
  outline-offset: 2px;
}

/* 按钮特殊处理 */
.btn:focus-visible {
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.2);
}

/* 输入框 focus */
.input:focus {
  border-color: #D97706;
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.1);
}
```

### 8.3 Loading 状态

```tsx
// 按钮加载状态
<Button disabled={loading}>
  {loading ? (
    <>
      <Spinner className="animate-spin mr-2" />
      处理中...
    </>
  ) : (
    '保存'
  )}
</Button>

// 页面加载骨架屏
<div className="space-y-4">
  <SkeletonCard />
  <SkeletonCard />
  <SkeletonCard />
</div>

// 加载指示器
<div className="flex items-center justify-center py-12">
  <Spinner className="w-8 h-8 animate-spin text-amber-600" />
  <span className="ml-3 text-gray-600">加载中...</span>
</div>
```

### 8.4 错误处理与提示

```tsx
// 表单验证错误
<div className="space-y-1">
  <Label>配置名称</Label>
  <Input
    value={value}
    onChange={onChange}
    error={!!error}
  />
  {error && (
    <p className="text-xs text-red-600 flex items-center gap-1">
      <AlertCircleIcon className="w-3 h-3" />
      {error}
    </p>
  )}
</div>

// 全局 Toast 通知
toast({
  title: "保存成功",
  description: "配置已更新",
  variant: "success",
  duration: 3000,
});

// 确认对话框
<ConfirmDialog
  title="确认删除"
  description="此操作无法撤销，是否继续？"
  onConfirm={handleDelete}
  confirmLabel="删除"
  confirmVariant="danger"
/>
```

---

## 九、响应式设计

### 9.1 断点系统

```css
/* Tailwind 默认断点 */

sm: 640px   /* 小屏幕 */
md: 768px   /* 平板 */
lg: 1024px  /* 桌面 */
xl: 1280px  /* 大桌面 */
2xl: 1536px /* 超大屏幕 */
```

### 9.2 响应式布局

```tsx
// 侧边栏响应式
<div className="
  fixed left-0 top-14 bottom-0
  w-60
  transform -translate-x-full lg:translate-x-0
  transition-transform duration-300
  lg:static lg:top-0
  z-10
">
  {/* 移动端遮罩 */}
  <div
    className={`
      fixed inset-0 bg-black/50 z-0
      ${sidebarOpen ? 'block' : 'hidden'}
      lg:hidden
    `}
    onClick={() => setSidebarOpen(false)}
  />
</div>

// 统计卡片响应式
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* 自动调整为:
       - 移动端: 1列
       - 平板: 2列
       - 桌面: 4列
  */}
</div>

// 内容区响应式边距
<div className="px-4 md:px-6 lg:px-8">
  {/* 移动端: 16px, 平板: 24px, 桌面: 32px */}
</div>
```

---

## 十、无障碍设计 (A11y)

### 10.1 键盘导航

```tsx
// 确保所有交互元素可键盘访问
<a
  href="/path"
  className="focus-visible:ring-2 focus-visible:ring-amber-600"
>
  可访问链接
</a>

<button
  className="focus-visible:ring-2 focus-visible:ring-amber-600"
  aria-label="刷新数据"
>
  <RefreshIcon />
</button>

// Tab 顺序符合视觉顺序
<nav>
  <button aria-label="刷新" />
  <button aria-label="设置" />
  <button aria-label="切换主题" />
</nav>
```

### 10.2 语义化 HTML

```tsx
// 使用正确的语义化标签
<header>
  <h1>ClaudeCode 配置管理</h1>
</header>

<nav aria-label="主导航">
  <ul>
    <li><a href="/dashboard">概览</a></li>
    <li><a href="/skills">Skills</a></li>
  </ul>
</nav>

<main>
  <article>
    <h2>Skills 管理</h2>
    <section>
      <h3>全局 Skills</h3>
      <!-- 内容 -->
    </section>
  </article>
</main>

<footer>
  <p>&copy; 2026 ClaudeCode Config Manager</p>
</footer>
```

### 10.3 ARIA 标签

```tsx
// 图标按钮必须有 aria-label
<button aria-label="刷新数据">
  <RefreshIcon />
</button>

// 复杂组件需要 aria 描述
<div role="tabpanel" aria-labelledby="tab-skills">
  <!-- Skills 内容 -->
</div>

// 状态变化需要 aria-live
<div aria-live="polite" aria-atomic="true">
  {toastMessage}
</div>

// 表单关联
<label htmlFor="config-name">配置名称</label>
<input id="config-name" aria-describedby="name-hint" />
<p id="name-hint" className="text-sm text-gray-500">
  为此配置起一个易于识别的名称
</p>
```

### 10.4 颜色对比度

```css
/* 确保文本与背景对比度 ≥ 4.5:1 */

/* ✅ 正确 - 对比度 12.6:1 */
.text-primary {
  color: #1C1917; /* gray-900 */
  background: #FAFAF9; /* gray-50 */
}

/* ✅ 正确 - 对比度 5.2:1 */
.text-secondary {
  color: #57534E; /* gray-600 */
  background: #FAFAF9; /* gray-50 */
}

/* ❌ 错误 - 对比度不足 */
.text-bad {
  color: #A8A29E; /* gray-400 */
  background: #FAFAF9; /* gray-50 */
}

/* 使用工具检查: https://webaim.org/resources/contrastchecker/ */
```

---

## 十一、动画与过渡

### 11.1 过渡时长规范

```css
/* 微交互 - 150ms */
transition: all 150ms ease;

/* 标准交互 - 200ms */
transition: all 200ms ease;

/* 复杂动画 - 300ms */
transition: all 300ms ease;

/* 避免超过 500ms，会让用户感觉卡顿 */
```

### 11.2 缓动函数

```css
/* 默认缓动 */
ease: cubic-bezier(0.4, 0, 0.2, 1);

/* 快入缓出 */
ease-out: cubic-bezier(0, 0, 0.2, 1);

/* 缓入快出 */
ease-in: cubic-bezier(0.4, 0, 1, 1);

/* 推荐使用 ease 或 ease-out */
```

### 11.3 减少动画 (Reduced Motion)

```css
/* 尊重用户的动画偏好设置 */

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 11.4 常用动画示例

```css
/* 淡入 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 滑入 */
@keyframes slideIn {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 缩放 */
@keyframes scaleIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* 使用 */
<div className="animate-[fadeIn_200ms_ease-out]">
  内容
</div>
```

---

## 十二、深色模式设计

### 12.1 深色模式色彩映射

```css
/* ===== 深色模式变量 ===== */

@media (prefers-color-scheme: dark) {
  :root {
    /* 背景色 */
    --bg-primary: #1C1917;   /* gray-900 */
    --bg-secondary: #292524; /* gray-800 */
    --bg-tertiary: #44403C;  /* gray-700 */

    /* 文本色 */
    --text-primary: #FAFAF9; /* gray-50 */
    --text-secondary: #A8A29E; /* gray-400 */
    --text-tertiary: #78716C; /* gray-500 */

    /* 边框色 */
    --border-color: #44403C; /* gray-700 */

    /* 强调色 */
    --accent-primary: #F59E0B; /* amber-500 (lighter for dark mode) */
    --accent-hover: #FBBF24; /* amber-400 */
  }
}
```

### 12.2 深色模式组件示例

```tsx
// 卡片深色模式
<div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
  <h3 className="text-gray-900 dark:text-gray-50">标题</h3>
  <p className="text-gray-600 dark:text-gray-400">正文</p>
</div>

// 按钮深色模式
<Button className="bg-amber-600 dark:bg-amber-500 text-white dark:text-gray-900">
  点击
</Button>

// 输入框深色模式
<Input className="
  bg-white dark:bg-gray-800
  border-gray-200 dark:border-gray-700
  text-gray-900 dark:text-gray-50
  placeholder:text-gray-400
" />
```

---

## 十三、图标系统

### 13.1 图标库选择

```
推荐: Lucide React (与 shadcn/ui 集成)

安装:
npm install lucide-react

使用:
import { Settings, Refresh, Folder, Cube } from 'lucide-react';
```

### 13.2 图标使用规范

```tsx
// 图标大小规范
const iconSizes = {
  xs: 'w-3 h-3',   // 12px - 小图标
  sm: 'w-4 h-4',   // 16px - 标准图标
  md: 'w-5 h-5',   // 20px - 中等图标
  lg: 'w-6 h-6',   // 24px - 大图标
  xl: 'w-8 h-8',   // 32px - 页面标题图标
};

// 使用示例
<Settings className="w-5 h-5" />

// 图标颜色
<Settings className="w-5 h-5 text-gray-600" />
<Settings className="w-5 h-5 text-amber-600" />

// 图标 + 文字按钮
<Button>
  <Refresh className="w-4 h-4 mr-2" />
  刷新
</Button>

// 圆形图标容器
<div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
  <Cube className="w-5 h-5 text-amber-600" />
</div>
```

---

## 十四、Tailwind CSS 配置

### 14.1 tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'], // 支持手动切换深色模式
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 温暖灰色调
        gray: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
          950: '#0C0A09',
        },
        // 强调色
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          'Monaco',
          '"Cascadia Code"',
          '"Roboto Mono"',
          'monospace',
        ],
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-in': 'slideIn 200ms ease-out',
        'spin': 'spin 1s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

---

## 十五、开发检查清单

### 15.1 视觉质量检查

- [ ] **无表情符号图标** - 所有图标使用 SVG，不使用 🎨 🚀 ⚙️ 等表情符号
- [ ] **图标一致性** - 统一使用 Lucide React，图标大小一致
- [ ] **Hover 效果** - 所有可点击元素有明确的 hover 状态
- [ ] **Focus 状态** - 所有交互元素有可见的 focus ring
- [ ] **颜色使用** - 直接使用主题色 (bg-amber-600)，不使用 var() 包装

### 15.2 交互检查

- [ ] **Cursor pointer** - 所有可点击元素添加 `cursor-pointer`
- [ ] **过渡动画** - 动画时长 150-300ms，使用 ease 缓动
- [ ] **加载状态** - 按钮在异步操作时显示 loading 状态
- [ ] **错误提示** - 表单验证错误清晰显示在对应字段旁

### 15.3 响应式检查

- [ ] **移动端测试** - 在 375px、768px 测试
- [ ] **侧边栏响应** - 移动端可折叠/展开
- [ ] **表格滚动** - 小屏幕下表格可横向滚动
- [ ] **触摸目标** - 所有按钮/链接最小 44x44px

### 15.4 无障碍检查

- [ ] **键盘导航** - Tab 顺序符合视觉顺序
- [ ] **ARIA 标签** - 图标按钮有 aria-label
- [ ] **颜色对比** - 文本对比度 ≥ 4.5:1
- [ ] **语义化 HTML** - 正确使用 header/nav/main 等标签

### 15.5 性能检查

- [ ] **图片优化** - 使用 WebP 格式，添加 lazy loading
- [ ] **代码分割** - 使用 React.lazy 懒加载路由
- [ ] **减少重渲染** - 使用 React.memo、useMemo 优化
- [ ] **减少动画** - 检查 prefers-reduced-motion

---

## 十六、实施建议

### 16.1 shadcn/ui 组件使用

```bash
# 安装 shadcn/ui
npx shadcn-ui@latest init

# 安装所需组件
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add label
npx shadcn-ui@latest add input
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add separator
```

### 16.2 组件自定义

```tsx
// components/ui/button.tsx
// 修改 primary 按钮为琥珀色

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 disabled:opacity-50",
          {
            'bg-amber-600 text-white hover:bg-amber-700': variant === 'primary',
            'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50': variant === 'secondary',
            'hover:bg-gray-100': variant === 'ghost',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
```

### 16.3 全局样式

```css
/* globals.css */

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 98%;
    --foreground: 0 0% 11%;
  }

  .dark {
    --background: 0 0% 11%;
    --foreground: 0 0% 98%;
  }

  * {
    @apply border-gray-200 dark:border-gray-700;
  }

  body {
    @apply bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-50;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

---

## 附录：快速参考

### 常用 Tailwind 类

```html
<!-- 布局 -->
<div class="flex items-center justify-between gap-4">
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

<!-- 间距 -->
<div class="p-4 m-2 space-y-4 gap-2">

<!-- 文本 -->
<h1 class="text-3xl font-bold text-gray-900">
<p class="text-sm text-gray-600">

<!-- 颜色 -->
<div class="bg-white border border-gray-200">
<button class="bg-amber-600 hover:bg-amber-700 text-white">

<!-- 圆角 -->
<div class="rounded-lg rounded-md rounded-full">

<!-- 阴影 -->
<div class="shadow-sm shadow-md shadow-lg">

<!-- 过渡 -->
<div class="transition-all duration-200 ease-in-out">
```

### 常用组件模式

```tsx
// 页面头部
<PageHeader title="标题" actions={<Button />} />

// 卡片
<Card>
  <CardHeader><CardTitle>标题</CardTitle></CardHeader>
  <CardContent>内容</CardContent>
</Card>

// 按钮
<Button variant="primary" onClick={handler}>
  点击
</Button>

// 输入框
<Label>标签</Label>
<Input value={value} onChange={e => setValue(e.target.value)} />

// 开关
<Switch checked={enabled} onCheckedChange={setEnabled} />

// 对话框
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>内容</DialogContent>
</Dialog>

// Toast
toast({ title: "成功", description: "操作完成" })
```

---

**设计书版本**: v1.0
**最后更新**: 2026-02-05
**设计师**: Claude Code + UI/UX Pro Max
