# ClaudeCode Config Manager

> A lightweight desktop application for visually managing Claude Code configuration files.

## Status

🚧 **Planning Phase** - Design documents complete, implementation pending. **Technology stack updated to Neutralino + Node.js** for simpler development.

## Overview

ClaudeCode Config Manager is a visual desktop tool that solves the problem of scattered Claude Code configurations across multiple locations:

- `~/.claude/settings.json` - Global ClaudeCode settings
- `~/.claude/skills/*/SKILL.md` - Global skills
- `~/.mcp.json` - Global MCP (Model Context Protocol) servers
- `/path/to/project/.claude/` - Project-specific configs
- `/path/to/project/CLAUDE.md` - Project instructions

### Key Features

- **Unified Dashboard**: View all ClaudeCode configs in one place
- **Visual Editor**: Edit JSON/Markdown configs with syntax highlighting and validation
- **Safe Operations**: Preview changes before applying, automatic backups created
- **Quick Toggles**: Enable/disable Skills and MCP servers with one click
- **Connection Testing**: Test MCP server health status
- **Lightweight**: Built with Neutralino for small size (5-10MB) and fast startup

### Tech Stack

**Desktop Framework**: Neutralino (lightweight alternative to Electron/Tauri)
**Frontend**: React 18 + TypeScript + Vite
**UI**: shadcn/ui (Tailwind CSS + Radix UI)
**State**: Zustand
**Backend**: Node.js (unified JavaScript/TypeScript stack)
**Editor**: Monaco Editor (VS Code's editor)

**Why Neutralino + Node.js?**
- **Pure JavaScript/TypeScript**: No need to learn Rust (unlike Tauri)
- **Smaller than Electron**: 5-10MB vs 150MB+
- **Faster Development**: Unified stack, no context switching
- **Simpler Debugging**: Browser DevTools for everything

## Project Documentation

- [CLAUDE.md](./CLAUDE.md) - Development guide for AI assistants working on this codebase
- [ClaudeCode Config Manager - Simplified Design (Chinese)](./ClaudeCode可视化管理 - 简化设计文档.md) - Technical architecture
- [UI/UX Design Specifications (Chinese)](./ClaudeCode可视化管理-UI-UX设计书.md) - Detailed UI design
- [Iteration Delivery Plan (Chinese)](./ClaudeCode可视化管理-迭代交付计划.md) - 8-week development roadmap
- [Technology Comparison (Chinese)](./技术方案对比.md) - Comparison of desktop frameworks

## Development Status

### Planned Features

#### Phase 1: Foundation (Week 1-2)
- [ ] Neutralino + React project setup
- [ ] Configuration file reading (JSON/Markdown)
- [ ] Dashboard with statistics
- [ ] Basic file tree component

#### Phase 2: Core Features (Week 3-4) - MVP
- [ ] Monaco Editor integration
- [ ] Configuration editing with validation
- [ ] Skills management (enable/disable)
- [ ] MCP servers management
- [ ] Connection testing for MCP servers
- [ ] Diff preview before save
- [ ] Automatic backup creation

#### Phase 3: Polish (Week 5-6)
- [ ] Dark mode support
- [ ] Global search across configs
- [ ] Keyboard shortcuts
- [ ] Error handling improvements
- [ ] Performance optimization

#### Phase 4: Advanced (Week 7-8)
- [ ] Configuration import/export
- [ ] Configuration templates
- [ ] CLI command execution
- [ ] Plugin system foundation

## Design Principles

1. **Simple First**: Only build essential features
2. **Passive Response**: Manual refresh only, no file watching
3. **Cautious Operations**: Preview changes, auto-backup
4. **Lightweight**: Fast startup, small bundle
5. **Unified Stack**: Pure JavaScript/TypeScript - simpler development

## Performance Targets

| Metric | MVP Target | v1.0 Target |
|--------|-----------|-------------|
| Startup Time | <3s | <2s |
| App Size | <10MB | <8MB |
| Memory Usage | <60MB | <50MB |
| UI Response | <500ms | <200ms |

## Technology Choice: Why Neutralino?

### Comparison with Alternatives

| Aspect | Electron | Tauri + Rust | **Neutralino + Node.js** | VS Code Extension |
|--------|----------|--------------|-------------------------|-------------------|
| **Bundle Size** | 150MB+ | 15MB | **5-10MB** | <1MB |
| **Startup Time** | 3-5s | <1s | **<2s** | Instant |
| **Memory Usage** | 200MB+ | <80MB | **<60MB** | <20MB |
| **Language** | JavaScript | Rust + JS | **JavaScript only** | JavaScript only |
| **Learning Curve** | Low | High (Rust) | **Low** | Medium |
| **Dev Speed** | Fast | Slow | **Fast** | Medium |
| **Ecosystem** | Mature | Growing | **Good** | Limited to VS Code |

### Key Advantages

1. **No Rust Required**: Unlike Tauri, no need to learn a new language
2. **Smaller than Electron**: Uses system webview instead of bundling Chromium
3. **Full JS/TS Stack**: Share code between frontend and backend
4. **Fast Development**: No context switching between languages
5. **Easy Debugging**: Browser DevTools for everything

## Getting Started (When Implementation Begins)

```bash
# Install Neutralino CLI
npm install -g @neutralinojs/neu

# Create project
neu create claude-config-manager
# Select: Neutralino.js + React + TypeScript

# Install dependencies
cd claude-config-manager
npm install zustand lucide-react @monaco-editor/react date-fns

# Setup shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card switch dialog dropdown-menu

# Development
npm run dev

# Build
npm run build

# Generate release binaries
neu release
```

See [CLAUDE.md](./CLAUDE.md) for detailed development commands and architecture.

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│              React UI (Frontend)                     │
│  ┌──────────┬──────────┬──────────┬──────────┐      │
│  │ Dashboard│  Skills  │   MCP    │ Projects │      │
│  └──────────┴──────────┴──────────┴──────────┘      │
└─────────────────┬───────────────────────────────────┘
                  │ Neutralino IPC
┌─────────────────▼───────────────────────────────────┐
│         Node.js Backend (background/)               │
│  • loadAllData()    • readConfig()                  │
│  • writeConfig()    • validateConfig()              │
│  • toggleSkill()    • testMcpConnection()           │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│         File System (ClaudeCode configs)             │
│  ~/.claude/, ~/.mcp.json, project/.claude/          │
└─────────────────────────────────────────────────────┘
```

**Key Points**:
- Pure JavaScript/TypeScript stack
- No database - all data in-memory (Zustand)
- Manual refresh only - no file watching
- Automatic backups before write
- JSON validation before save

## License

TBD

## Contributing

This project is currently in the planning phase. Contributions will be welcome once implementation begins.

---

**Note**: This repository currently contains design documents only. Implementation has not yet started. Technology stack has been updated from Tauri + Rust to Neutralino + Node.js for simpler development and unified JavaScript/TypeScript stack.
