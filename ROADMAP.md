# Claude Code Config Manager - 演进路线图

> 最后更新：2026-02-10

## 概述

本文档列出 Claude Code Config Manager 尚未实现的功能，按优先级和难度分级。

---

## 第一阶段：核心功能（优先实施）

### 1. Rules 管理（编码规范）✅ 进行中

```
难度：★★★☆☆  价值：★★★★★
状态：待实施
文件位置：~/.claude/rules/*.md
```

**功能说明**：
- 管理语言特定的编码规范（如 `typescript.md`, `python.md`）
- 按语言分类显示
- 创建/编辑/删除规则
- 规则启用/禁用切换

**需要做**：
- [ ] 后端：扫描 `~/.claude/rules/` 目录
- [ ] 前端：新增 `src/pages/RulesPage.tsx`
- [ ] UI：语言标签页、规则编辑器、启用开关
- [ ] API：`GET /api/rules/all`, `POST /api/rules/create`, `POST /api/rules/update`, `DELETE /api/rules/delete`

**理由**：直接影响代码质量，核心功能

---

### 4. Contexts 管理（模式提示）

```
难度：★★★☆☆  价值：★★★☆☆
状态：待实施
文件位置：~/.claude/contexts/*.md
```

**功能说明**：
- 管理模式特定的系统提示（如 "code-review", "debugging"）
- 创建/编辑上下文模式
- 激活上下文切换

**需要做**：
- [ ] 后端：扫描 `~/.claude/contexts/` 目录
- [ ] 前端：新增 `src/pages/ContextsPage.tsx`
- [ ] UI：上下文列表、编辑器、激活状态
- [ ] API：`GET /api/contexts/all`, `POST /api/contexts/create`, `DELETE /api/contexts/delete`

**理由**：高级用户定制需求

---

## 第三阶段：高级特性

### 5. Hooks 管理 🔥 最复杂

```
难度：★★★★★  价值：★★★★★
状态：待实施
文件位置：~/.claude/hooks.json
```

**功能说明**：
- 管理14种事件类型的钩子（SessionStart, PreToolUse, PostToolUse, 等）
- 支持3种Hook类型（command, prompt, agent）
- Hook启用/禁用
- Hook测试执行

**14种事件类型**：
1. SessionStart - 会话开始时
2. UserPromptSubmit - 用户提交提示前
3. PreToolUse - 工具调用前
4. PermissionRequest - 权限请求前
5. PostToolUse - 工具调用后
6. PostToolUseFailure - 工具调用失败后
7. Notification - 通知时
8. SubagentStart - 子代理启动前
9. SubagentStop - 子代理停止后
10. Stop - 会话停止前
11. TeammateIdle - Teammate空闲时
12. TaskCompleted - 任务完成时
13. PreCompact - 上下文压缩前
14. SessionEnd - 会话结束时

**需要做**：
- [ ] 后端：读取 `~/.claude/hooks.json`
- [ ] 前端：新增 `src/pages/HooksPage.tsx`
- [ ] UI：事件类型选择器、Hook编辑器、测试面板
- [ ] API：`GET /api/hooks/all`, `POST /api/hooks/create`, `POST /api/hooks/update`, `DELETE /api/hooks/delete`

**理由**：最强大的扩展机制，但实现最复杂

---

### 6. Instincts & Memory（持续学习）

```
难度：★★★★☆  价值：★★★☆☆
状态：待实施
```

**功能说明**：
- 查看 AI 学习历史
- 手动添加记忆
- 清空记忆

**需要做**：
- [ ] 后端：读取 Instincts 数据（格式待确认）
- [ ] 前端：新增 `src/pages/MemoryPage.tsx`
- [ ] UI：记忆时间线、添加对话框、清空按钮
- [ ] API：`GET /api/memory/all`, `POST /api/memory/add`, `DELETE /api/memory/clear`

**理由**：高级AI特性，用户可能较少使用

---

## 建议实施顺序

| 顺序 | 功能 | 预计工作量 | 理由 |
|------|------|-----------|------|
| **1** | **Rules** | 6-8小时 | 核心功能，高影响 |
| **2** | Commands | 4-6小时 | 高价值，中等难度 |
| **3** | Contexts | 4-6小时 | 完善配置管理 |
| **4** | Hooks | 10-15小时 | 最终boss，最复杂 |
| **5** | Instincts & Memory | 待定 | 需要先了解数据格式 |

---

## 已实现功能 ✅

- [x] **Skills 管理** - 全局和项目级技能
- [x] **MCP Servers 管理** - MCP服务器和工具
- [x] **SubAgents 管理** - 子代理配置
- [x] **Projects 管理** - 项目扫描和配置查看
- [x] **Config Files 编辑** - JSON/Markdown文件编辑
- [x] **Environment Variables** - 环境变量扩展
- [x] **Wishlist** - 技能和MCP的愿望清单
- [x] **Rules 管理** - 语言特定编码规范（开发中）

---

## 技术准备工作

### 后端扫描扩展
```typescript
// server/index.ts 需要添加扫描逻辑
- scanRulesDir()        // ~/.claude/rules/
- scanCommandsDir()     // ~/.claude/commands/
- scanContextsDir()     // ~/.claude/contexts/
- readHooksFile()       // ~/.claude/hooks.json
```

### API端点新增
```typescript
// Rules (Current)
GET    /api/rules/all
POST   /api/rules/create
POST   /api/rules/update
DELETE /api/rules/delete

// Commands
GET    /api/commands/all
POST   /api/commands/create
DELETE /api/commands/delete

// Rules
GET    /api/rules/all
POST   /api/rules/create
POST   /api/rules/update
DELETE /api/rules/delete

// Contexts
GET    /api/contexts/all
POST   /api/contexts/create
DELETE /api/contexts/delete

// Hooks
GET    /api/hooks/all
POST   /api/hooks/create
POST   /api/hooks/update
DELETE /api/hooks/delete
```

### 导航菜单扩展
```tsx
// src/components/Sidebar.tsx 需要添加新入口
- Rules (规则) ✅ 当前进行中
- Commands (命令)
- Contexts (上下文)
- Hooks (钩子)
```

---

## 参考资料

- [Claude Code Hooks 文档](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/comm-use-cases-hooks)
- [Claude Code 官方仓库](https://github.com/anthropics/claude-code)
- [Claude Code 配置结构](https://docs.anthropic.com/en/docs/claude-code/overview)
