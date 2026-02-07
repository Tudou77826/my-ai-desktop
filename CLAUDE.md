# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ClaudeCode Config Manager** - A lightweight desktop application for visually managing Claude Code configuration files scattered across `~/.claude/`, `~/.mcp.json`, and project `.claude/` directories.

**Current Status**: Implementation in progress (not just planning).

### Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui (Tailwind CSS + Radix UI)
- **State**: Zustand
- **Backend**: Express.js (Node.js) on port 3001
- **Code Editor**: Monaco Editor
- **Desktop**: Neutralino (for desktop packaging only)

**Key Architecture Decision**: The app uses a **separate Express backend server** instead of Neutralino IPC. This means:
- Development: Frontend (Vite dev server on port from config) + Backend (port 3001)
- Backend runs standalone with `npm run server`
- Frontend communicates via HTTP REST API to `http://localhost:3001/api/*`

---

## Development Commands

```bash
# Install dependencies
npm install

# Development - Start both servers (run in separate terminals)
npm run dev          # Frontend (Vite dev server)
npm run server       # Backend (Express on port 3001)

# Or start both in one command (Unix/Mac only)
npm run dev:all

# Build for production
npm run build        # TypeScript check + Vite build

# Type checking
npx tsc --noEmit     # Check types without emitting files

# Linting
npm run lint
npm run format
```

---

## Architecture

### Backend Architecture (Express.js)

The backend (`server/index.ts`) is a **standalone Express server** that exposes REST APIs:

```
┌─────────────────────────────────────────────────────┐
│         React Frontend (Vite dev server)            │
│                  http://localhost:3737              │
└────────────────────┬────────────────────────────────┘
                     │ HTTP REST API
┌────────────────────▼────────────────────────────────┐
│         Express.js Backend (port 3001)              │
│  • /api/data/all       • /api/config/read          │
│  • /api/config/write   • /api/mcp/toggle            │
│  • /api/projects/scan  • /api/projects/remove       │
│  • /api/skills/create  • /api/env/expand            │
└────────────────────┬────────────────────────────────┘
                     │ File System
┌────────────────────▼────────────────────────────────┐
│  ~/.claude/, ~/.mcp.json, project/.claude/          │
│  ~/.claude-config-manager-projects.json (state)     │
└─────────────────────────────────────────────────────┘
```

**Key Backend Files**:
- `server/index.ts` - Main Express server, all API endpoints
- `server/validator.ts` - JSON/Markdown validation
- `server/handlers/mcp-tools.ts` - MCP tools/resources management
- `server/handlers/skill-manager.ts` - Skill creation/testing
- `server/handlers/env-expander.ts` - Environment variable expansion

### Project Persistence Model

**Important**: Projects are stored in `~/.claude-config-manager-projects.json` with two lists:

```typescript
{
  "included": ["D:\\dev\\my-project"],  // User-added/imported projects
  "excluded": ["D:\\dev\\old-project"] // Projects user removed (won't be re-scanned)
}
```

**Why two lists?**
- `included`: Projects the user has explicitly added (via "Add Project" or scan/import)
- `excluded`: Projects the user has deleted - these are blocked from appearing even if auto-scanned

This prevents deleted projects from reappearing after page refresh.

### State Management

- **No database** - All data in-memory (Zustand store in frontend)
- **Manual refresh only** - No file watching
- **Project persistence** - Only the included/excluded project lists are persisted to disk
- **Configs** - Read directly from ClaudeCode config files on demand

---

## Core API Endpoints

### Data Loading
```typescript
GET /api/data/all
// Returns: { skills[], mcpServers[], projects[], configFiles[] }
```

### Config File Operations
```typescript
GET /api/config/read?path=<filepath>
POST /api/config/write { path, content, backup }
POST /api/config/validate { configType, content }
```

### Project Management
```typescript
GET /api/projects/scan?searchPath=<path>
POST /api/project/add { projectPath }
POST /api/projects/remove { projectPath }  // Adds to excluded list
GET /api/project/detail?path=<projectPath>
```

### MCP & Skills
```typescript
POST /api/mcp/toggle { serverId, enabled }
POST /api/mcp/test { transport, url }
POST /api/skill/toggle { skillId, enabled }
POST /api/skills/create { scope, projectPath, skill }
POST /api/env/expand { value }
```

---

## Important Patterns

### Adding a New Backend Endpoint

1. Add route in `server/index.ts`:
```typescript
app.get('/api/my-endpoint', async (req, res) => {
  try {
    const { param } = req.query;
    // ... logic
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});
```

2. Add wrapper in `src/lib/api.ts`:
```typescript
async myEndpoint(param: string): Promise<ResultType> {
  return apiCall('/my-endpoint?param=' + encodeURIComponent(param));
}
```

### Project Scanning Flow

When user scans a directory:
1. Frontend calls `api.scanProjects(path)`
2. Backend recursively scans directory for `.claude/` or `CLAUDE.md`
3. Projects found are added to `manuallyAddedProjects` Set
4. Backend saves to `~/.claude-config-manager-projects.json`
5. Frontend calls `loadData()` to refresh display

**Important**: Scanned projects are automatically persisted. Deleted projects go to `excludedProjects` Set to prevent re-scanning.

### Config File Editing Flow

1. User selects file → `api.readConfig(path)`
2. Monaco editor loads content
3. User edits → Click Save
4. Frontend calls `api.validateConfig()` → If invalid, show error
5. Frontend calls `api.writeConfig(path, content, backup=true)`
6. Backend creates `.backup` file, writes new content
7. Frontend shows success toast

---

## File Paths Reference

**Locations the app reads/writes**:
```
~/.claude/settings.json              # Global ClaudeCode settings
~/.claude/skills/*/SKILL.md          # Global skills
~/.mcp.json                          # Global MCP servers
~/path/to/project/.claude/           # Project-specific config
~/path/to/project/CLAUDE.md          # Project instructions
~/.claude-config-manager-projects.json  # Project lists (included/excluded)
```

**Path Expansion** (handled by `expandPath()` in backend):
- `~` → User home directory (`os.homedir()`)
- On Windows: `C:\Users\<username>`
- On Unix: `/home/<username>`

---

## UI/UX Guidelines

### Colors
Use Tailwind classes directly (no CSS variables):
- Backgrounds: `bg-gray-50`, `bg-white`
- Text: `text-gray-900` (primary), `text-gray-600` (body), `text-gray-500` (secondary)
- Primary actions: `bg-amber-600 hover:bg-amber-700`
- Borders: `border-gray-200`

### Icons
- Use Lucide React only: `import { Settings, Refresh, Folder } from 'lucide-react'`
- Sizes: `w-4 h-4`, `w-5 h-5`, `w-6 h-6`
- **Never use emoji in UI**

### Component Patterns
```tsx
// Button
<Button className="bg-amber-600 hover:bg-amber-700 text-white">Save</Button>

// Card
<div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
  Content
</div>
```

---

## Key Constraints

- **No file watching** - Manual refresh only
- **No database** - In-memory state (Zustand) + file-based project lists
- **Always backup** - Create `.backup` file before write
- **Always validate** - JSON schema check before write
- **Pure JavaScript/TypeScript** - No Rust, Go, etc.
- **HTTP API** - Backend is Express server on port 3001, not Neutralino IPC

---

## Debugging

**Backend**: Check `debug.log` file (created in project root)
```bash
# Backend writes to debug.log and console.error
tail -f debug.log
```

**Frontend**: Browser DevTools (Vite provides sourcemaps)

**Common Issues**:
- Port 3001 in use: Kill existing Node process
- Projects reappearing after delete: Check `excludedProjects` Set logic
- Config not saving: Check file permissions and path expansion

---

## Recent Implementation Notes

- **Project exclusion feature**: Deleted projects are added to `excludedProjects` Set to prevent re-scanning
- **Project import via scan**: User can now scan custom paths (input field instead of preset buttons)
- **Data format migration**: Backend auto-migrates old array format to new `{included, excluded}` format
- **Markdown support**: Config editor now supports both JSON and Markdown (CLAUDE.md) files
