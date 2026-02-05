# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ClaudeCode Config Manager** is a lightweight desktop application for visually managing Claude Code configuration files. It addresses the pain point of scattered configuration files across multiple locations.

### Core Value Proposition
- **Single Purpose**: Visualize and manage ClaudeCode configs scattered across `~/.claude/`, `~/.mcp.json`, and project `.claude/` directories
- **Passive Design**: Manual refresh only - no continuous file watching
- **Safe Operations**: Preview changes before applying, automatic backups
- **Lightweight**: Target startup <3s, app size <10MB, memory <60MB

### Technology Stack

**Desktop Framework**: Neutralino (lightweight alternative to Electron/Tauri)
**Frontend**: React 18 + TypeScript + Vite
**UI Library**: shadcn/ui (Radix UI + Tailwind CSS)
**State Management**: Zustand (<1KB)
**Backend**: Node.js (unified with frontend)
**Code Editor**: Monaco Editor

**Why Neutralino over Electron/Tauri**:
- **Electron**: Bundle 150MB+, ships entire Chromium
- **Tauri**: 15MB, but requires Rust knowledge (steep learning curve)
- **Neutralino**: 5-10MB, uses system webview, pure JavaScript/TypeScript
- **Development Speed**: Full JS/TS stack, no context switching between languages

---

## Development Commands

```bash
# Initial Setup (First time only)
npm install -g @neutralinojs/neu
neu create claude-config-manager
# Select: Neutralino.js + React + TypeScript

# Install Dependencies
cd claude-config-manager
npm install

# Install UI Components
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card switch dialog dropdown-menu toast label input badge separator

# Install Core Dependencies
npm install zustand lucide-react @monaco-editor/react date-fns

# Development (Start both frontend and backend)
npm run dev

# Build Desktop Application
npm run build

# Generate Release Binaries
neu release
# Outputs: dist/ClaudeCode-Config-Manager-win-x64.exe
#          dist/ClaudeCode-Config-Manager-mac-x64.dmg
#          dist/ClaudeCode-Config-Manager-linux-x64.deb
```

---

## Architecture

### Data Flow (Passive/On-Demand)

```
User Action → UI Event → Neutralino API → Node.js Handler → File System → Return Data → UI Update
                        ↑
                  Manual Refresh or Edit Operation
```

**Key Design Principles**:
- No persistent database - all data in-memory (Zustand store)
- Manual refresh only - no file watching
- Atomic file writes with automatic `.backup` creation
- JSON schema validation before write
- Pure JavaScript/TypeScript stack - no language context switching

### Directory Structure

```
claude-config-manager/
├── src/                         # React frontend
│   ├── components/              # UI components
│   │   ├── Dashboard.tsx        # Overview page with stats
│   │   ├── SkillsList.tsx       # Skills management
│   │   ├── MCPServers.tsx       # MCP server management
│   │   ├── Projects.tsx         # Project management
│   │   ├── ConfigEditor.tsx     # File editor with Monaco
│   │   └── ui/                  # shadcn/ui components
│   ├── lib/                     # Utilities
│   │   ├── api.ts              # Neutralino API wrappers
│   │   └── file-utils.ts       # File operation helpers
│   ├── store/                   # Zustand state
│   │   └── appStore.ts         # Global app state
│   ├── types/                   # TypeScript types
│   │   └── index.ts            # Core type definitions
│   ├── background/              # Node.js backend (Neutralino)
│   │   ├── index.ts            # Main backend entry point
│   │   ├── config-handler.ts   # Config file operations
│   │   ├── cli-handler.ts      # CLI command execution
│   │   └── validator.ts        # JSON validation
│   └── App.tsx                  # Root component
├── resources/                   # Neutralino resources
│   └── icons/                  # App icons
├── bin/                         # Built binaries (generated)
├── neutralino.config.json       # Neutralino configuration
├── package.json
└── vite.config.ts
```

---

## Backend API (Node.js)

The Node.js backend exposes these functions via Neutralino's IPC:

```typescript
// background/index.ts - Main backend entry point

import { os, filesystem } from '@neutralinojs/lib';

// API Handler - All functions exposed to frontend
export const api = {
  // ==================== Data Loading ====================

  async loadAllData(): Promise<AppData> {
    const globalConfig = await this.readConfig('~/.claude/settings.json');
    const mcpConfig = await this.readConfig('~/.mcp.json');
    const skills = await this.scanDirectory('~/.claude/skills/*');
    const projects = await this.findProjects('~/projects');

    return {
      skills,
      mcpServers: mcpConfig?.mcpServers || [],
      projects,
      configFiles: [globalConfig, mcpConfig],
    };
  },

  async refreshData(): Promise<AppData> {
    // Same as loadAllData - force reload from disk
    return this.loadAllData();
  },

  // ==================== File Operations ====================

  async readConfig(path: string): Promise<ConfigFile> {
    const expandedPath = this.expandPath(path);
    const exists = await filesystem.fileExists(expandedPath);

    if (!exists) {
      throw new Error(`Config file not found: ${path}`);
    }

    const raw = await filesystem.readFile(expandedPath);
    const content = this.parseJSON(raw);

    return {
      path: expandedPath,
      type: this.inferConfigType(path),
      scope: this.inferScope(path),
      format: 'json',
      content,
      raw,
    };
  },

  async writeConfig(
    path: string,
    content: string,
    backup: boolean = true
  ): Promise<void> {
    const expandedPath = this.expandPath(path);

    // Create backup if requested
    if (backup && await filesystem.fileExists(expandedPath)) {
      const backupPath = `${expandedPath}.backup`;
      await filesystem.writeFile(backupPath, await filesystem.readFile(expandedPath));
    }

    // Validate JSON if it's a JSON file
    if (path.endsWith('.json')) {
      try {
        JSON.parse(content);
      } catch (error) {
        throw new Error(`Invalid JSON: ${error.message}`);
      }
    }

    // Write file
    await filesystem.writeFile(expandedPath, content);
  },

  // ==================== Validation & Preview ====================

  async validateConfig(configType: string, content: string): Promise<ValidationResult> {
    try {
      const parsed = JSON.parse(content);

      // Basic validation rules
      if (configType === 'mcp') {
        if (!parsed.mcpServers || !Array.isArray(parsed.mcpServers)) {
          return { valid: false, errors: ['mcpServers must be an array'] };
        }
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, errors: [error.message] };
    }
  },

  async previewChanges(path: string, newContent: string): Promise<string> {
    const oldContent = await this.readConfig(path);
    return this.generateDiff(oldContent.raw, newContent);
  },

  // ==================== Toggles ====================

  async toggleSkill(skillId: string, enabled: boolean): Promise<void> {
    const configPath = '~/.claude/settings.json';
    const config = await this.readConfig(configPath);

    if (!config.content.disabledSkills) {
      config.content.disabledSkills = [];
    }

    if (enabled) {
      config.content.disabledSkills = config.content.disabledSkills.filter((id: string) => id !== skillId);
    } else {
      config.content.disabledSkills.push(skillId);
    }

    await this.writeConfig(configPath, JSON.stringify(config.content, null, 2), true);
  },

  async toggleMcpServer(serverId: string, enabled: boolean): Promise<void> {
    const configPath = '~/.mcp.json';
    const config = await this.readConfig(configPath);

    const server = config.content.mcpServers.find((s: any) => s.id === serverId);
    if (server) {
      server.enabled = enabled;
      await this.writeConfig(configPath, JSON.stringify(config.content, null, 2), true);
    }
  },

  // ==================== MCP Testing ====================

  async testMcpConnection(server: MCPServer): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      if (server.transport === 'http') {
        const response = await fetch(server.config.url, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });

        const latency = Date.now() - startTime;

        if (response.ok) {
          return {
            status: 'ok',
            latency,
            lastCheck: new Date(),
          };
        } else {
          return {
            status: 'error',
            error: `HTTP ${response.status}`,
            lastCheck: new Date(),
          };
        }
      } else if (server.transport === 'stdio') {
        // Test stdio by spawning the process
        // Implementation depends on specific MCP server
        return {
          status: 'unknown',
          lastCheck: new Date(),
        };
      }
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        lastCheck: new Date(),
      };
    }
  },

  // ==================== CLI Execution ====================

  async execClaudeCommand(args: string[]): Promise<string> {
    const { exec } = require('child_process');

    return new Promise((resolve, reject) => {
      exec(
        `claude ${args.join(' ')}`,
        { maxBuffer: 1024 * 1024 * 10 }, // 10MB buffer
        (error: any, stdout: string, stderr: string) => {
          if (error) {
            reject(new Error(stderr || error.message));
          } else {
            resolve(stdout);
          }
        }
      );
    });
  },

  // ==================== Utility Functions ====================

  expandPath(path: string): string {
    return path.replace(/^~\//, os.getEnvVar('HOME') + '/');
  },

  parseJSON(raw: string): any {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  inferConfigType(path: string): 'settings' | 'mcp' | 'claude_md' {
    if (path.includes('mcp.json')) return 'mcp';
    if (path.includes('settings.json')) return 'settings';
    if (path.includes('CLAUDE.md')) return 'claude_md';
    return 'settings';
  },

  inferScope(path: string): 'global' | 'project' {
    if (path.includes('.claude/')) return 'project';
    return 'global';
  },

  generateDiff(oldText: string, newText: string): string {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const diff: string[] = [];

    const maxLines = Math.max(oldLines.length, newLines.length);

    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i] || '';
      const newLine = newLines[i] || '';

      if (oldLine !== newLine) {
        if (oldLine) diff.push(`- ${oldLine}`);
        if (newLine) diff.push(`+ ${newLine}`);
      }
    }

    return diff.join('\n');
  },

  async scanDirectory(pattern: string): Promise<any[]> {
    // Use filesystem.readDirectory or Node.js fs
    const { readdirSync } = require('fs');
    const path = require('path');

    const expandedPath = this.expandPath(pattern.replace('/*', ''));
    const items = readdirSync(expandedPath, { withFileTypes: true });

    return items
      .filter(item => item.isDirectory())
      .map(item => ({
        id: item.name,
        path: path.join(expandedPath, item.name),
      }));
  },

  async findProjects(searchPath: string): Promise<any[]> {
    // Search for directories containing .claude/ or CLAUDE.md
    const { readdirSync, statSync } = require('fs');
    const path = require('path');

    const expandedPath = this.expandPath(searchPath);
    const projects: any[] = [];

    const items = readdirSync(expandedPath, { withFileTypes: true });

    for (const item of items) {
      if (!item.isDirectory()) continue;

      const projectPath = path.join(expandedPath, item.name);
      const claudePath = path.join(projectPath, '.claude');
      const claudeMdPath = path.join(projectPath, 'CLAUDE.md');

      try {
        const claudeExists = statSync(claudePath).isDirectory();
        const claudeMdExists = statSync(claudeMdPath).isFile();

        if (claudeExists || claudeMdExists) {
          projects.push({
            id: projectPath,
            name: item.name,
            path: projectPath,
            exists: true,
          });
        }
      } catch {
        // Ignore errors
      }
    }

    return projects;
  },
};

// Export API for Neutralino
export default api;
```

**Usage from React**:
```typescript
import { invoke } from './lib/api';

// Load all data
const data = await invoke('loadAllData');

// Write config with backup
await invoke('writeConfig', {
  path: '~/.mcp.json',
  content: JSON.stringify(newConfig, null, 2),
  backup: true,
});

// Toggle skill
await invoke('toggleSkill', { skillId: 'commit', enabled: false });
```

---

## Core Data Models

```typescript
// Skill - A ClaudeCode skill directory
interface Skill {
  id: string;                    // Directory name
  path: string;                  // Full path
  scope: 'global' | 'project';
  enabled: boolean;
  metadata?: {
    name?: string;
    description?: string;
    author?: string;
  };
  content?: string;              // SKILL.md content (lazy loaded)
}

// MCP Server - Model Context Protocol server
interface MCPServer {
  id: string;                    // Server name
  scope: 'global' | 'project';
  transport: 'stdio' | 'sse' | 'http';
  config: {
    command?: string;
    args?: string[];
    url?: string;
    env?: Record<string, string>;
  };
  enabled: boolean;
  health?: {
    status: 'unknown' | 'ok' | 'error';
    latency?: number;
    lastCheck?: Date;
    error?: string;
  };
}

// Project - Code repository with ClaudeCode config
interface Project {
  id: string;                    // Project path as ID
  name: string;                  // Directory name
  path: string;                  // Full path
  exists: boolean;
  config?: {
    skills?: string[];
    mcpServers?: string[];
    settings?: Record<string, any>;
  };
  claudeMd?: {
    path: string;
    content: string;
  };
  lastModified?: Date;
}

// Config File - Any configuration file
interface ConfigFile {
  path: string;
  type: 'settings' | 'mcp' | 'claude_md';
  scope: 'global' | 'project';
  format: 'json' | 'markdown';
  content?: any;
  raw?: string;
}

// App State
interface AppState {
  data: {
    skills: Skill[];
    mcpServers: MCPServer[];
    projects: Project[];
    configFiles: ConfigFile[];
  };
  ui: {
    selectedTab: string;
    isLoading: boolean;
    lastRefresh: Date;
  };
}
```

---

## UI Layout: Claude Desktop Style

```
┌─────────────────────────────────────────────────────┐
│  Header (56px fixed)                                │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│  Sidebar │       Main Content Area                  │
│  (240px) │       (flex-1, padding 24px)            │
│          │                                          │
│  • 📊    │       Dynamic content based on           │
│  • 🧩    │       sidebar selection                  │
│  • 🔌    │                                          │
│  • 📁    │                                          │
│  • 📝    │                                          │
└──────────┴──────────────────────────────────────────┘
```

### Navigation Tabs (Sidebar)
1. **📊 概览** - Dashboard with stats and health
2. **🧩 Skills** - Skills management with enable/disable
3. **🔌 MCP** - MCP servers with connection testing
4. **📁 项目** - Project list with their configs
5. **📝 配置** - File tree + Monaco editor

### Color System (Warm Gray Palette)

```css
/* Use these Tailwind classes directly - no custom CSS variables */

/* Backgrounds */
bg-gray-50   /* #FAFAF9 - Main page background */
bg-white     /* Card backgrounds */
bg-gray-100  /* Sidebar background */

/* Text */
text-gray-900 /* #1C1917 - Primary text, headings */
text-gray-600 /* #57534E - Body text */
text-gray-500 /* #78716C - Secondary text */

/* Primary Actions */
bg-amber-600 hover:bg-amber-700 /* Primary buttons */
text-amber-600 /* Links, accents */

/* Borders */
border-gray-200 /* #E7E5E4 - Standard borders */
```

**Important**: Use Tailwind classes directly. Do NOT use CSS custom properties like `var(--gray-900)`. Always use `bg-amber-600`, not `bg-[var(--accent)]`.

### Component Guidelines

**Icons**:
- Use Lucide React exclusively: `import { Settings, Refresh, Folder } from 'lucide-react'`
- Standard sizes: `w-4 h-4` (16px), `w-5 h-5` (20px), `w-6 h-6` (24px)
- Add color: `<Settings className="w-5 h-5 text-gray-600" />`

**Buttons**:
```tsx
<Button className="bg-amber-600 hover:bg-amber-700 text-white">
  Save
</Button>
<Button className="bg-white border border-gray-200 hover:bg-gray-50">
  Cancel
</Button>
```

**Cards**:
```tsx
<div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-all">
  Content
</div>
```

**No Emoji Icons**: Never use emoji like 🎨 🚀 ⚙️ in the UI. Use Lucide React SVG icons only.

---

## Key Workflows

### 1. Edit Configuration File

```
User opens file → Monaco loads content → User edits → Click Save
  ↓
invoke('validateConfig') → If invalid: show error
  ↓
invoke('previewChanges') → Show diff dialog
  ↓
User confirms → invoke('writeConfig', {backup:true}) → Success toast
```

### 2. Toggle Skill/MCP

```
User flips switch → invoke('toggleSkill') / invoke('toggleMcpServer')
  ↓
Node.js: Read config → Modify JSON → Validate → Write with backup
  ↓
Return success/error → Update local state → Toast notification
```

### 3. Refresh Data

```
User clicks refresh → invoke('refreshData') → Node.js scans all dirs
  ↓
Return new AppData → Zustand store update → UI re-renders
```

---

## File Paths (Important)

The app reads/writes these locations:

```
~/.claude/settings.json           # Global ClaudeCode settings
~/.claude/skills/*/SKILL.md       # Global skills
~/.mcp.json                       # Global MCP servers
~/path/to/project/.claude/        # Project-specific config
~/path/to/project/CLAUDE.md       # Project instructions
```

**Path Expansion**:
```typescript
// Backend handles ~ expansion
expandPath('~/config.json') // → '/Users/username/config.json'

// Cross-platform support
const homeDir = os.getEnvVar('HOME'); // macOS/Linux
// or os.getEnvVar('USERPROFILE'); // Windows
```

---

## MVP Feature Scope (What to Build First)

**Phase 1 (Week 1-2)**: Foundation
- [x] Neutralino + React project setup
- [ ] Implement backend API functions in `background/index.ts`
- [ ] Build Dashboard page with stats
- [ ] Create basic file tree component

**Phase 2 (Week 3-4)**: Core Editing
- [ ] Monaco Editor integration
- [ ] Implement `writeConfig` with backup
- [ ] Build Skills list with toggle
- [ ] Build MCP servers list with connection test
- [ ] Diff preview dialog

**What NOT to build (yet)**:
- ❌ Real-time file watching (use manual refresh)
- ❌ Cloud sync
- ❌ Configuration templates
- ❌ Plugin system
- ❌ CLI integration beyond basic execution

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| **Startup Time** | <3s (MVP), <2s (v1.0) | From app launch to interactive |
| **App Size** | <10MB (MVP), <8MB (v1.0) | Neutralino makes this achievable |
| **Memory** | <60MB (MVP), <50MB (v1.0) | No background processes |
| **Response Time** | <500ms | All UI operations |

---

## Design Principles Reference

1. **Simple Priority**: Only build necessary features. Remove anything non-essential.
2. **Passive Response**: Read data on demand. Never poll or watch files.
3. **Cautious Operations**: Preview every destructive action. Auto-backup before write.
4. **Lightweight**: Fast startup, small bundle, minimal dependencies.
5. **Unified Stack**: Pure JavaScript/TypeScript - no language context switching.

---

## Common Tasks

### Add a New Backend API Function

1. Add function to `background/index.ts`:
   ```typescript
   async myNewFunction(arg: string): Promise<string> {
     return `Hello ${arg}`;
   }
   ```

2. Register in Neutralino config (if needed):
   ```json
   // neutralino.config.json
   {
     "nativeAllowList": [
       {
         "name": "myNewFunction",
         "description": "My new API function"
       }
     ]
   }
   ```

3. Call from React:
   ```typescript
   import { invoke } from './lib/api';
   const result = await invoke('myNewFunction', { arg: 'World' });
   ```

### Add a New UI Page

1. Create component in `src/components/PageName.tsx`
2. Add route in `App.tsx` (or state-based routing)
3. Add sidebar item
4. Update `selectedTab` state on click

### Debug Backend

```typescript
// Use console.log - output goes to terminal
console.log('Debug info:', data);

// Use Neutralino debug mode
neu run --debug
```

---

## Getting Started Workflow

When starting development:

1. **Initialize Neutralino Project**:
   ```bash
   npm install -g @neutralinojs/neu
   neu create claude-config-manager
   # Select: Neutralino.js + React + TypeScript
   ```

2. **Install Dependencies**:
   ```bash
   cd claude-config-manager
   npm install zustand lucide-react @monaco-editor/react date-fns
   npx shadcn-ui@latest init
   npx shadcn-ui@latest add button card switch dialog
   ```

3. **Set up TypeScript types** in `src/types/index.ts`

4. **Create Zustand store** in `src/store/appStore.ts`

5. **Implement backend API** in `background/index.ts`

6. **Build Dashboard** component

7. **Iterate**: Add more pages and functions following the architecture

---

## Important Constraints

- **No emojis in UI**: Use Lucide React icons only
- **No CSS variables**: Use Tailwind classes directly (e.g., `bg-amber-600`)
- **No file watching**: Manual refresh only
- **No database**: In-memory only (Zustand)
- **No backend server**: Neutralino IPC only
- **No auto-updates**: Manual save with preview
- **Always backup**: Create `.backup` file before write
- **Always validate**: JSON schema check before write
- **Pure JavaScript/TypeScript**: No Rust, no Go, no other backend language

---

## Advantages Over Tauri

| Aspect | Tauri + Rust | Neutralino + Node.js |
|--------|--------------|---------------------|
| **Learning Curve** | Steep (need Rust) | Gentle (already know JS) |
| **Development Speed** | Slower (context switch) | Faster (unified stack) |
| **Debugging** | Need Rust tools | Browser DevTools |
| **Bundle Size** | 15MB | 5-10MB |
| **Memory Usage** | <80MB | <60MB |
| **Code Reuse** | Can't share backend code | Can share utilities |
| **Community** | Growing rapidly | Smaller but focused |
| **Documentation** | Good | Good |

---

## Related Documentation

- `ClaudeCode可视化管理 - 简化设计文档.md` - Technical architecture and data models (Chinese)
- `ClaudeCode可视化管理-UI-UX设计书.md` - Detailed UI/UX specifications (Chinese)
- `ClaudeCode可视化管理-迭代交付计划.md` - 8-week development roadmap (Chinese)
- `技术方案对比.md` - Comparison of Electron/Tauri/Neutralino/VS Code (Chinese) - TODO
