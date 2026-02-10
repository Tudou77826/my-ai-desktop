# ClaudeCode Config Manager

> A lightweight desktop application for visually managing Claude Code configuration files.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-cyan)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)

## Overview

ClaudeCode Config Manager is a visual desktop tool that solves the problem of scattered Claude Code configurations across multiple locations. Instead of editing JSON and Markdown files manually, you get a unified dashboard with:

- **Unified Dashboard**: View all ClaudeCode configs in one place
- **Visual Editor**: Edit JSON/Markdown configs with Monaco Editor (VS Code's editor)
- **Safe Operations**: Automatic backups, validation, and preview before applying changes
- **Quick Toggles**: Enable/disable Skills, MCP servers, and Commands with one click
- **Project Management**: Scan and manage multiple projects with their configurations
- **Rule Management**: Create and manage coding rules for different programming languages
- **SubAgent Management**: Configure custom AI agents with specific tools and instructions

### Key Features

- 📁 **Project Scanner** - Automatically discover projects with ClaudeCode configurations
- 🔧 **Config Editor** - Edit JSON and Markdown files with syntax highlighting
- ✅ **Validation** - Real-time JSON schema validation before saving
- 💾 **Auto Backup** - Automatic `.backup` file creation before any write operation
- 🔄 **Quick Toggle** - Enable/disable Skills, MCP servers, and Commands
- 🧪 **Connection Testing** - Test MCP server connectivity
- 📝 **Monaco Editor** - Full-featured code editor with IntelliSense
- 🌍 **Localization** - English and Chinese language support
- 🎨 **Modern UI** - Clean interface built with shadcn/ui components

## Tech Stack

- **Desktop Framework**: Neutralino (lightweight alternative to Electron)
- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui (Tailwind CSS + Radix UI)
- **State Management**: Zustand
- **Backend**: Express.js (Node.js) on port 3001
- **Code Editor**: Monaco Editor

### Architecture

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
│  • /api/skills/create  • /api/commands/create       │
└────────────────────┬────────────────────────────────┘
                     │ File System
┌────────────────────▼────────────────────────────────┐
│  ~/.claude/, ~/.mcp.json, project/.claude/          │
└─────────────────────────────────────────────────────┘
```

## Screenshots

*(Add screenshots here when available)*

## Installation

### Prerequisites

- Node.js 20 or higher
- npm or yarn

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/my-ai-desktop.git
cd my-ai-desktop

# Install dependencies
npm install

# Start the backend server (in one terminal)
npm run server

# Start the frontend dev server (in another terminal)
npm run dev

# Or start both in one command (Unix/Mac only)
npm run dev:all
```

The application will be available at:
- Frontend: http://localhost:3737
- Backend API: http://localhost:3001

### Building for Production

```bash
# Build the frontend
npm run build

# Build for desktop (requires Neutralino CLI)
npm run build:desktop
```

## Usage

### Managing Projects

1. Click **"Scan Projects"** to discover projects with `.claude/` directories
2. Add custom projects by clicking **"Add Project"**
3. Remove projects by clicking the delete button (they won't be re-scanned)

### Editing Configuration Files

1. Navigate to any config section (Skills, MCP Servers, Commands, Rules, etc.)
2. Click the **Edit** button on any item
3. Monaco Editor will open with the file content
4. Make your changes
5. Click **Save** - the app will:
   - Validate JSON files automatically
   - Create a `.backup` file
   - Write the new content
   - Show success/error feedback

### Creating New Items

- **Skills**: Click "Create Skill" button, choose scope (global or project)
- **Commands**: Click "Create Command", write command in Markdown with YAML frontmatter
- **Rules**: Click "Create Rule", select programming language
- **SubAgents**: Click "Create SubAgent", configure tools, skills, and instructions

## File Locations

The application manages these locations:

```
~/.claude/settings.json              # Global ClaudeCode settings
~/.claude/skills/*/SKILL.md          # Global skills
~/.claude/commands/*.md              # Global commands
~/.claude/rules/*.md                 # Language-specific coding rules
~/.claude/subagents/*.json           # Custom AI agents
~/.mcp.json                          # Global MCP servers
/path/to/project/.claude/            # Project-specific config
/path/to/project/CLAUDE.md           # Project instructions
~/.claude-config-manager-projects.json  # Project lists (included/excluded)
```

## Development

### Project Structure

```
my-ai-desktop/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── lib/               # Utilities and API client
│   ├── store/             # Zustand state management
│   └── types/             # TypeScript type definitions
├── server/                # Express backend
│   ├── handlers/          # API endpoint handlers
│   ├── index.ts           # Main server file
│   └── validator.ts       # JSON/Markdown validation
├── public/                # Static assets
├── resources/             # Neutralino resources
└── neutralino.config.json # Desktop app configuration
```

### API Endpoints

See [CLAUDE.md](./CLAUDE.md) for complete API documentation.

Key endpoints:
- `GET /api/data/all` - Load all configuration data
- `GET /api/config/read?path=<file>` - Read a config file
- `POST /api/config/write` - Write a config file (with backup)
- `POST /api/mcp/toggle` - Enable/disable MCP server
- `GET /api/projects/scan` - Scan directory for projects

### Coding Standards

- Use TypeScript for type safety
- Follow ESLint configuration
- Use Prettier for code formatting
- Write self-documenting code with meaningful variable names
- See `CLAUDE.md` for detailed coding guidelines

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Roadmap

- [ ] Dark mode support
- [ ] Configuration import/export
- [ ] Configuration templates
- [ ] Global search across all configs
- [ ] Keyboard shortcuts
- [ ] File watching (optional)
- [ ] Plugin system
- [ ] Better error handling and recovery

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [React](https://react.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Code editor by [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- Desktop framework by [Neutralino](https://neutralino.js.org/)
- Icon library from [Lucide](https://lucide.dev/)

## Support

If you find any bugs or have feature requests, please [open an issue](https://github.com/yourusername/my-ai-desktop/issues).

---

**Note**: This project is not affiliated with or endorsed by Anthropic. It is a community tool for managing Claude Code configurations.
