# ClaudeCode Config Manager

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-cyan)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)

一个用于可视化管理和编辑 Claude Code 配置文件的桌面应用。

## 项目背景

Claude Code 的配置文件分散在多个位置：

```
~/.claude/settings.json              # 全局设置
~/.claude/skills/*/SKILL.md          # 全局技能
~/.claude/commands/*.md              # 全局命令
~/.claude/rules/*.md                 # 编码规则
~/.mcp.json                          # MCP 服务器配置
/path/to/project/.claude/            # 项目配置
/path/to/project/CLAUDE.md           # 项目指令
```

手动编辑这些 JSON 和 Markdown 文件比较繁琐，本项目旨在提供一个统一的图形界面来管理这些配置。

## 当前功能

### 已实现

- **配置文件管理**
  - 读取和编辑 `~/.claude/settings.json`
  - 管理全局和项目级别的 Skills
  - 管理全局和项目级别的 Commands
  - 管理语言特定的编码规则
  - 管理 MCP 服务器配置
  - 管理自定义 SubAgents

- **编辑器**
  - 集成 Monaco Editor（VS Code 的编辑器组件）
  - 支持 JSON 和 Markdown 语法高亮
  - 保存前自动验证 JSON 格式
  - 写入前自动创建 `.backup` 备份文件

- **项目管理**
  - 扫描指定目录查找包含 `.claude/` 或 `CLAUDE.md` 的项目
  - 添加/移除项目
  - 项目排除列表（删除后不会重新扫描）

- **其他**
  - 中英文双语界面
  - 一键启用/禁用 Skills、Commands、MCP 服务器
  - MCP 服务器连接测试（当前为模拟数据）

## 技术栈

- **前端**: React 18 + TypeScript + Vite
- **UI 组件**: shadcn/ui（基于 Tailwind CSS 和 Radix UI）
- **状态管理**: Zustand
- **后端**: Express.js（运行在 3001 端口）
- **代码编辑器**: Monaco Editor
- **桌面框架**: Neutralino（计划中，当前为 Web 版本）

## 架构说明

当前实现采用前后端分离架构：

```
React 前端 (Vite Dev Server)
    ↓ HTTP REST API
Express.js 后端 (端口 3001)
    ↓ 文件系统操作
Claude Code 配置文件
```

**后端 API** (Express.js):
- 提供所有文件系统操作的 REST API
- 处理配置文件的读取、写入、验证
- 扫描项目目录
- 管理 MCP、Skills、Commands 的 CRUD 操作

**前端** (React):
- 通过 HTTP API 与后端通信
- 使用 Zustand 管理状态
- 不直接操作文件系统

## 安装和运行

### 前置要求

- Node.js >= 20
- npm

### 开发模式

```bash
# 克隆仓库
git clone https://github.com/Tudou77826/my-ai-desktop.git
cd my-ai-desktop

# 安装依赖
npm install

# 启动后端服务（终端 1）
npm run server

# 启动前端服务（终端 2）
npm run dev
```

访问地址：
- 前端: http://localhost:3737
- 后端 API: http://localhost:3001

### 生产构建

```bash
# 构建前端
npm run build

# 桌面应用打包（需要安装 Neutralino CLI）
npm run build:desktop
```

## 项目结构

```
my-ai-desktop/
├── src/                    # React 前端
│   ├── components/         # UI 组件
│   │   ├── layout/        # 布局组件
│   │   ├── Dashboard.tsx  # 仪表盘
│   │   ├── SkillsList.tsx # 技能管理
│   │   ├── MCPServers.tsx # MCP 服务器管理
│   │   ├── CommandsList.tsx # 命令管理
│   │   ├── RulesPage.tsx  # 规则管理
│   │   └── SubAgentsPage.tsx # SubAgent 管理
│   ├── lib/               # 工具和 API 客户端
│   ├── store/             # Zustand 状态管理
│   └── types/             # TypeScript 类型定义
├── server/                # Express 后端
│   ├── handlers/          # API 处理器
│   │   ├── skill-manager.ts      # Skills CRUD
│   │   ├── mcp-tools.ts          # MCP 工具
│   │   ├── env-expander.ts       # 环境变量展开
│   │   └── subagent-manager.ts   # SubAgent 管理
│   ├── index.ts           # 主服务器文件
│   └── validator.ts       # JSON/Markdown 验证
├── public/                # 静态资源
└── neutralino.config.json # Neutralino 配置
```

## API 端点

主要 API 端点：

```
GET  /api/data/all          # 加载所有配置数据
GET  /api/config/read       # 读取配置文件
POST /api/config/write      # 写入配置文件（带备份）
POST /api/mcp/toggle        # 启用/禁用 MCP 服务器
GET  /api/projects/scan     # 扫描项目目录
POST /api/projects/remove   # 移除项目
POST /api/skills/create     # 创建 Skill
POST /api/commands/create   # 创建 Command
POST /api/rules/create      # 创建 Rule
POST /api/subagents/save    # 保存 SubAgent
```

完整 API 文档见 [CLAUDE.md](./CLAUDE.md)。

## 开发指南

### 代码规范

- 使用 TypeScript 进行类型检查
- 遵循 ESLint 配置
- 使用 Prettier 格式化代码
- 详细的编码指南见 [CLAUDE.md](./CLAUDE.md)

### 类型检查

```bash
npx tsc --noEmit
```

### 代码检查

```bash
npm run lint
npm run format
```

## 已知限制

1. **MCP 工具和资源获取**: 当前返回模拟数据，未实现真实的 MCP 协议连接
2. **文件监听**: 不支持自动刷新配置，需要手动点击刷新按钮
3. **桌面打包**: Neutralino 桌面应用尚未完全实现，当前主要作为 Web 应用使用
4. **测试**: 未包含自动化测试

## 贡献

欢迎贡献！请遵循以下流程：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 路线图

- [ ] 实现真实的 MCP 协议连接
- [ ] 添加文件监听和自动刷新
- [ ] 完善桌面应用打包
- [ ] 添加单元测试和 E2E 测试
- [ ] 暗色主题支持
- [ ] 配置导入/导出功能
- [ ] 全局搜索功能

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 致谢

- [React](https://react.dev/) - 前端框架
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - 代码编辑器
- [Neutralino](https://neutralino.js.org/) - 桌面应用框架
- [Lucide](https://lucide.dev/) - 图标库

## 免责声明

本项目与 Anthropic 无关，也不是官方的 Claude Code 工具。它是一个社区开发的配置管理辅助工具。
