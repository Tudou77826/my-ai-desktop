// ==================== Node.js Backend Server ====================
// Express server for file system operations

import express from 'express';
import cors from 'cors';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { createWriteStream } from 'fs';
import { load as yamlLoad } from 'js-yaml';
import { validateConfig } from './validator';
import {
  getMcpTools,
  getMcpResources,
  testMcpTool,
  getHealthHistory
} from './handlers/mcp-tools';
import {
  parseSkillFrontmatter,
  validateSkillFrontmatter,
  createSkill,
  testSkill,
  getSkillTemplates
} from './handlers/skill-manager';
import {
  loadAllSubAgents,
  saveSubAgent,
  deleteSubAgent,
  validateSubAgentConfig
} from './handlers/subagent-manager';
import { expandEnvVars, findEnvVarReferences } from './handlers/env-expander';

const app = express();
const PORT = 3001;

// Create a write stream for debug logging
const logStream = createWriteStream('debug.log', { flags: 'a' });

function debugLog(...args: any[]) {
  const message = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
  logStream.write(message + '\n');
  console.error(message); // Also try console.error
}

// Middleware
app.use(cors());
app.use(express.json());

// ==================== Persistent Storage ====================
// Store projects in a file with two lists: included and excluded
const PROJECTS_FILE = path.join(os.homedir(), '.claude-config-manager-projects.json');
const WISHLIST_FILE = path.join(os.homedir(), '.claude-config-manager-wishlist.json');

interface ProjectListData {
  included: string[];
  excluded: string[];
}

interface WishlistItem {
  id: string;
  title: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  completed: boolean;
}

interface WishlistData {
  mcp: WishlistItem[];
  skills: WishlistItem[];
  subagents: WishlistItem[];
}

let manuallyAddedProjects = new Set<string>();
let excludedProjects = new Set<string>();
const wishlistData: WishlistData = { mcp: [], skills: [], subagents: [] };

// Load projects from file on startup
async function loadProjects() {
  try {
    if (await fileExists(PROJECTS_FILE)) {
      const content = await fs.readFile(PROJECTS_FILE, 'utf-8');
      const data = JSON.parse(content);

      // Check if it's the new format (object with included/excluded) or old format (array)
      if (data.included || data.excluded) {
        // New format
        const newData = data as ProjectListData;

        // Load included projects
        if (newData.included && Array.isArray(newData.included)) {
          const normalizedIncluded = newData.included.map((p: string) => path.normalize(p));
          manuallyAddedProjects = new Set(normalizedIncluded);
        }

        // Load excluded projects
        if (newData.excluded && Array.isArray(newData.excluded)) {
          const normalizedExcluded = newData.excluded.map((p: string) => path.normalize(p));
          excludedProjects = new Set(normalizedExcluded);
        }

        debugLog(`[DEBUG] Loaded ${manuallyAddedProjects.size} included and ${excludedProjects.size} excluded projects (new format)`);
      } else if (Array.isArray(data)) {
        // Old format - migrate to new format
        const projects = data as string[];
        const normalizedProjects = projects.map((p: string) => path.normalize(p));
        manuallyAddedProjects = new Set(normalizedProjects);
        debugLog(`[DEBUG] Migrated ${manuallyAddedProjects.size} projects from old array format to new format`);
        await saveProjects();
      }
    } else {
      debugLog('[DEBUG] Projects file does not exist, starting with empty lists');
    }
  } catch (error) {
    debugLog('[DEBUG] Failed to load projects:', (error as Error).message);
  }
}

// Save projects to file
async function saveProjects() {
  try {
    const data: ProjectListData = {
      included: Array.from(manuallyAddedProjects),
      excluded: Array.from(excludedProjects),
    };
    await fs.writeFile(PROJECTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    debugLog(`[DEBUG] Saved ${manuallyAddedProjects.size} included and ${excludedProjects.size} excluded projects`);
  } catch (error) {
    debugLog('[DEBUG] Failed to save projects:', (error as Error).message);
  }
}

// Load on startup
loadProjects();
loadWishlist();

// ==================== Wishlist Functions ====================

/**
 * Load wishlist from file
 */
async function loadWishlist() {
  try {
    console.log('[INFO] Loading wishlist...');
    if (await fileExists(WISHLIST_FILE)) {
      const content = await fs.readFile(WISHLIST_FILE, 'utf-8');
      const data = JSON.parse(content);

      if (data.mcp && Array.isArray(data.mcp)) {
        wishlistData.mcp = data.mcp;
      }
      if (data.skills && Array.isArray(data.skills)) {
        wishlistData.skills = data.skills;
      }

      debugLog(`[DEBUG] Loaded wishlist: ${wishlistData.mcp.length} MCP items, ${wishlistData.skills.length} Skill items`);
    } else {
      console.log('[INFO] Wishlist file does not exist, starting with empty wishlist');
    }
  } catch (error) {
    debugLog('[DEBUG] Failed to load wishlist:', (error as Error).message);
  }
}

/**
 * Save wishlist to file
 */
async function saveWishlist() {
  try {
    await fs.writeFile(WISHLIST_FILE, JSON.stringify(wishlistData, null, 2), 'utf-8');
    debugLog(`[DEBUG] Saved wishlist: ${wishlistData.mcp.length} MCP items, ${wishlistData.skills.length} Skill items`);
  } catch (error) {
    debugLog('[DEBUG] Failed to save wishlist:', (error as Error).message);
  }
}

/**
 * Generate a unique ID for wishlist items
 */
function generateId(): string {
  return `wishlist-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ==================== Utility Functions ====================

/**
 * Expand ~ to home directory and normalize path
 */
function expandPath(filePath: string): string {
  let expanded = filePath;
  if (filePath.startsWith('~')) {
    expanded = filePath.replace('~', os.homedir());
  }
  return path.normalize(expanded);
}

/**
 * Check if file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse SKILL.md file to extract metadata
 */
function parseSkillMetadata(content: string): any {
  const metadata: any = {};

  // Try to extract name from frontmatter or heading
  const nameMatch = content.match(/^#\s+(.+)$/m);
  if (nameMatch) {
    metadata.name = nameMatch[1].trim();
  }

  // Try to extract description
  const descMatch = content.match(/(?:描述|description):\s*(.+)$/im);
  if (descMatch) {
    metadata.description = descMatch[1].trim();
  }

  // Try to extract author
  const authorMatch = content.match(/(?:作者|author):\s*(.+)$/im);
  if (authorMatch) {
    metadata.author = authorMatch[1].trim();
  }

  return metadata;
}

/**
 * Extract description from command content
 * Supports both YAML frontmatter and Markdown title formats
 */
function extractCommandDescription(content: string): string {
  // Try to parse YAML frontmatter first
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (frontmatterMatch) {
    try {
      const frontmatter = yamlLoad(frontmatterMatch[1]) as any;
      if (frontmatter && frontmatter.description) {
        return String(frontmatter.description);
      }
    } catch (error) {
      // YAML parsing failed, continue to markdown title
    }
  }

  // Fallback: extract from first Markdown heading
  const firstLine = content.split('\n')[0];
  if (firstLine.startsWith('#')) {
    return firstLine.substring(1).trim();
  }

  return '';
}

// ==================== API Routes ====================

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Test endpoint - verify code execution
 */
app.get('/api/test', (req, res) => {
  res.json({ message: 'This is a test endpoint', timestamp: new Date().toISOString() });
});

/**
 * Load all configuration data
 */
app.get('/api/data/all', async (req, res) => {
  debugLog('[API] /api/data/all called at', new Date().toISOString());
  try {
    const results: any = {
      skills: [],
      mcpServers: [],
      projects: [],
      configFiles: [],
      rules: [],
      commands: []
    };

    // Load global settings
    try {
      const settingsPath = expandPath('~/.claude/settings.json');
      if (await fileExists(settingsPath)) {
        const content = await fs.readFile(settingsPath, 'utf-8');
        results.configFiles.push({
          path: settingsPath,
          type: 'settings',
          scope: 'global',
          format: 'json',
          content: JSON.parse(content),
          raw: content
        });
      }
    } catch (error) {
      console.log('Global settings not found:', error);
    }

    // Load MCP config
    try {
      const mcpPath = expandPath('~/.mcp.json');
      if (await fileExists(mcpPath)) {
        const content = await fs.readFile(mcpPath, 'utf-8');
        const mcpConfig = JSON.parse(content);
        results.configFiles.push({
          path: mcpPath,
          type: 'mcp',
          scope: 'global',
          format: 'json',
          content: mcpConfig,
          raw: content
        });

        // Convert mcpServers object to array format
        const mcpServersObj = mcpConfig.mcpServers || {};
        results.mcpServers = Object.entries(mcpServersObj).map(([id, config]: [string, any]) => ({
          id,
          transport: config.command ? 'stdio' : 'http',
          enabled: config.enabled !== false, // Default to true if not specified
          config: {
            command: config.command,
            args: config.args,
            url: config.url,
          }
        }));
      }
    } catch (error) {
      console.log('MCP config not found:', error);
    }

    // Scan skills directory
    try {
      const skillsPath = expandPath('~/.claude/skills');
      debugLog('[DEBUG] Scanning skills path:', skillsPath);

      if (await fileExists(skillsPath)) {
        const entries = await fs.readdir(skillsPath);
        debugLog('[DEBUG] Found entries:', entries);

        for (const entryName of entries) {
          const skillDir = path.join(skillsPath, entryName);
          debugLog(`[DEBUG] Checking entry: ${entryName}, path: ${skillDir}`);

          // Use stat to check if it's a directory (more reliable than isDirectory on Windows)
          try {
            const stat = await fs.stat(skillDir);
            debugLog(`[DEBUG] ${entryName} - isDirectory: ${stat.isDirectory()}`);
            if (!stat.isDirectory()) continue;
          } catch (err) {
            debugLog(`[DEBUG] ${entryName} - stat error:`, (err as Error).message);
            continue; // Skip if can't stat
          }

          const skillMdPath = path.join(skillDir, 'SKILL.md');

          try {
            const content = await fs.readFile(skillMdPath, 'utf-8');
            const metadata = parseSkillMetadata(content);

            debugLog(`[DEBUG] Adding skill: ${entryName}`);
            results.skills.push({
              id: entryName,
              path: skillDir,
              scope: 'global',
              enabled: true, // Default to enabled
              metadata,
              content
            });
          } catch (err) {
            debugLog(`[DEBUG] ${entryName} - SKILL.md error:`, (err as Error).message);
            // SKILL.md doesn't exist, still add skill without content
            results.skills.push({
              id: entryName,
              path: skillDir,
              scope: 'global',
              enabled: true
            });
          }
        }
        debugLog('[DEBUG] Total skills added:', results.skills.length);
      } else {
        debugLog('[DEBUG] Skills path does not exist');
      }
    } catch (error) {
      debugLog('Failed to scan skills:', error);
    }

    // Scan rules directory
    try {
      const rulesPath = expandPath('~/.claude/rules');
      debugLog('[DEBUG] Scanning rules path:', rulesPath);

      if (await fileExists(rulesPath)) {
        const entries = await fs.readdir(rulesPath);
        debugLog('[DEBUG] Found rules entries:', entries);

        for (const entryName of entries) {
          const rulePath = path.join(rulesPath, entryName);
          debugLog(`[DEBUG] Checking rule: ${entryName}, path: ${rulePath}`);

          // Skip if not a markdown file
          if (!entryName.endsWith('.md')) continue;

          // Extract language from filename (e.g., "typescript.md" -> "typescript")
          const language = entryName.replace('.md', '');

          try {
            const content = await fs.readFile(rulePath, 'utf-8');

            debugLog(`[DEBUG] Adding rule: ${entryName}`);
            results.rules.push({
              id: language,
              name: language,
              language: language,
              path: rulePath,
              scope: 'global',
              enabled: true,
              content
            });
          } catch (err) {
            debugLog(`[DEBUG] ${entryName} - read error:`, (err as Error).message);
          }
        }
        debugLog('[DEBUG] Total rules added:', results.rules.length);
      } else {
        debugLog('[DEBUG] Rules path does not exist');
      }
    } catch (error) {
      debugLog('Failed to scan rules:', error);
    }

    // Scan commands directory and add built-in commands
    try {
      results.commands = [];

      // Define built-in commands (these come with Claude Code)
      const builtinCommands = [
        { id: 'add-dir', name: 'Add Directory', description: 'Add a directory to the context' },
        { id: 'agents', name: 'Agents', description: 'List and manage available agents' },
        { id: 'bug', name: 'Bug', description: 'Help investigate and fix bugs' },
        { id: 'clear', name: 'Clear', description: 'Clear the conversation context' },
        { id: 'compact', name: 'Compact', description: 'Compact the context window' },
        { id: 'commit', name: 'Commit', description: 'Create a git commit' },
        { id: 'context', name: 'Context', description: 'View current context information' },
        { id: 'help', name: 'Help', description: 'Show help information' },
        { id: 'preview', name: 'Preview', description: 'Preview files or changes' },
        { id: 'test', name: 'Test', description: 'Run tests' },
        { id: 'review', name: 'Review', description: 'Review code changes' },
        { id: 'refactor', name: 'Refactor', description: 'Refactor code' },
        { id: 'document', name: 'Document', description: 'Generate documentation' },
        { id: 'explain', name: 'Explain', description: 'Explain code or concepts' },
        { id: 'fix', name: 'Fix', description: 'Fix code issues' },
      ];

      // Add built-in commands
      for (const cmd of builtinCommands) {
        results.commands.push({
          id: cmd.id,
          name: cmd.name,
          path: '',
          scope: 'builtin',
          enabled: true,
          builtin: true,
          description: cmd.description
        });
      }

      debugLog('[DEBUG] Added built-in commands:', builtinCommands.length);

      // Scan custom commands directory
      const commandsPath = expandPath('~/.claude/commands');
      debugLog('[DEBUG] Scanning commands path:', commandsPath);

      if (await fileExists(commandsPath)) {
        const entries = await fs.readdir(commandsPath);
        debugLog('[DEBUG] Found command entries:', entries);

        for (const entryName of entries) {
          const commandPath = path.join(commandsPath, entryName);
          debugLog(`[DEBUG] Checking command: ${entryName}, path: ${commandPath}`);

          // Skip if not a markdown file
          if (!entryName.endsWith('.md')) continue;

          // Extract command name from filename (e.g., "my-command.md" -> "my-command")
          const commandId = entryName.replace('.md', '');

          try {
            const content = await fs.readFile(commandPath, 'utf-8');
            const stats = await fs.stat(commandPath);

            // Extract description (supports YAML frontmatter and Markdown title)
            const description = extractCommandDescription(content);

            debugLog(`[DEBUG] Adding custom command: ${entryName} with description: ${description ? description.substring(0, 30) : 'NONE'}`);
            results.commands.push({
              id: commandId,
              name: commandId,
              path: commandPath,
              scope: 'global',
              enabled: true,
              builtin: false,
              content,
              description,
              lastModified: stats.mtime
            });
          } catch (err) {
            debugLog(`[DEBUG] ${entryName} - read error:`, (err as Error).message);
          }
        }
        debugLog('[DEBUG] Total custom commands added:', results.commands.length - builtinCommands.length);
      } else {
        debugLog('[DEBUG] Commands path does not exist');
      }

      // Scan plugin commands directories
      const pluginsBasePaths = [
        expandPath('~/.claude/plugins/marketplaces'),
        expandPath('~/.claude/plugins/cache'),
      ];

      for (const pluginsBasePath of pluginsBasePaths) {
        try {
          if (!(await fileExists(pluginsBasePath))) {
            continue;
          }

          // Read all plugin directories
          const pluginDirs = await fs.readdir(pluginsBasePath);

          for (const pluginDir of pluginDirs) {
            const pluginPath = path.join(pluginsBasePath, pluginDir);
            const pluginCommandsPath = path.join(pluginPath, 'commands');

            // Skip if commands directory doesn't exist
            if (!(await fileExists(pluginCommandsPath))) {
              continue;
            }

            debugLog(`[DEBUG] Scanning plugin commands: ${pluginCommandsPath}`);

            try {
              const entries = await fs.readdir(pluginCommandsPath);

              for (const entryName of entries) {
                if (!entryName.endsWith('.md')) continue;

                const commandPath = path.join(pluginCommandsPath, entryName);
                const commandId = entryName.replace('.md', '');

                // Skip if command already exists (prioritize user commands)
                if (results.commands.some(c => c.id === commandId)) {
                  debugLog(`[DEBUG] Skipping duplicate command: ${commandId} from ${pluginDir}`);
                  continue;
                }

                try {
                  const content = await fs.readFile(commandPath, 'utf-8');
                  const stats = await fs.stat(commandPath);

                  // Extract description (supports YAML frontmatter and Markdown title)
                  const description = extractCommandDescription(content);

                  debugLog(`[DEBUG] Adding plugin command: ${commandId} from ${pluginDir}`);
                  results.commands.push({
                    id: commandId,
                    name: commandId,
                    path: commandPath,
                    scope: 'global',
                    enabled: true,
                    builtin: false,
                    content,
                    description,
                    lastModified: stats.mtime
                  });
                } catch (err) {
                  debugLog(`[DEBUG] ${entryName} - read error:`, (err as Error).message);
                }
              }
            } catch (err) {
              debugLog(`[DEBUG] Failed to read plugin commands dir:`, (err as Error).message);
            }
          }
        } catch (err) {
          debugLog(`[DEBUG] Failed to scan plugin base path:`, (err as Error).message);
        }
      }

      debugLog('[DEBUG] Total commands (builtin + custom + plugins):', results.commands.length);
    } catch (error) {
      debugLog('Failed to scan commands:', error);
    }

    // Auto-scan projects from common locations
    try {
      const scanPaths = [
        '~', // Home directory
        '~/dev', '~/projects', '~/workspace', // Common project directories
        '~/Documents', // Windows projects
        'D:\\', 'D:\\dev', 'D:\\projects', // D drive paths
        'C:\\dev', 'C:\\projects', // C drive paths
      ];

      const scannedProjects = new Map<string, any>();

      for (const scanPath of scanPaths) {
        try {
          const expandedPath = expandPath(scanPath);
          debugLog(`[DEBUG] Scanning path: ${scanPath} -> ${expandedPath}`);
          if (!(await fileExists(expandedPath))) {
            debugLog(`[DEBUG] Path does not exist: ${expandedPath}`);
            continue;
          }

          // Scan directory with depth limit
          const beforeCount = scannedProjects.size;
          await scanDirectoryForProjects(expandedPath, scannedProjects, 0, 3);
          const afterCount = scannedProjects.size;
          debugLog(`[DEBUG] Scanned ${expandedPath}, found ${afterCount - beforeCount} projects`);
        } catch (err) {
          // Skip paths that don't exist or can't be accessed
          debugLog(`[DEBUG] Skipping path ${scanPath}:`, (err as Error).message);
        }
      }

      // Convert map to array
      results.projects = Array.from(scannedProjects.values());

      // Debug: log scanned projects containing my-ai-desktop
      const scannedMyAiDesktop = Array.from(scannedProjects.values()).filter(p => p.path.includes('my-ai-desktop') && !p.path.includes('.claude'));
      if (scannedMyAiDesktop.length > 0) {
        debugLog(`[DEBUG] Scanned my-ai-desktop projects:`, scannedMyAiDesktop.map(p => p.path));
      }

      // Add manually added projects that weren't found during scanning
      const manualProjectsArray = Array.from(manuallyAddedProjects);
      // Debug: log all manual projects containing my-ai-desktop
      const myAiDesktopManuals = manualProjectsArray.filter(p => p.includes('my-ai-desktop') && !p.includes('.claude'));
      debugLog(`[DEBUG] Manual projects with my-ai-desktop in Set:`, myAiDesktopManuals);
      debugLog(`[DEBUG] Raw Set size: ${manuallyAddedProjects.size}, filtered: ${myAiDesktopManuals.length}`);

      for (const projectPath of manualProjectsArray) {
        if (!scannedProjects.has(projectPath)) {
          // Debug: log if it's my-ai-desktop
          if (projectPath.includes('my-ai-desktop') && !projectPath.includes('.claude')) {
            debugLog(`[DEBUG] Adding manual my-ai-desktop project: ${projectPath}`);
            debugLog(`[DEBUG] Path length: ${projectPath.length}, chars:`, Array.from(projectPath).map(c => c.charCodeAt(0)));
          }
          try {
            const stats = await fs.stat(projectPath);
            const claudePath = path.join(projectPath, '.claude');
            const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
            const hasClaude = await fileExists(claudePath);
            const hasClaudeMd = await fileExists(claudeMdPath);

            results.projects.push({
              id: projectPath,
              name: path.basename(projectPath),
              path: projectPath,
              exists: true,
              lastModified: stats.mtime,
              hasClaudeConfig: hasClaude,
              hasClaudeMd: hasClaudeMd,
            });

            debugLog(`[DEBUG] Added manual project: ${projectPath}`);
          } catch (err) {
            // Project no longer exists, skip it
            debugLog(`[DEBUG] Manual project no longer exists: ${projectPath}`);
          }
        }
      }

      debugLog(`[DEBUG] Total ${results.projects.length} projects (auto-scanned + manual)`);

      // Don't auto-save all scanned projects to manual projects list
      // The manuallyAddedProjects Set should only contain projects that user
      // explicitly added via "Add Project" or imported via "Scan" button

      // Scan project config files
      for (const project of results.projects) {
        const projectPath = project.path;

        // Scan .claude directory for config files
        const claudeDir = path.join(projectPath, '.claude');
        if (await fileExists(claudeDir)) {
          try {
            const entries = await fs.readdir(claudeDir);

            for (const entry of entries) {
              // Only process JSON config files
              if (!entry.endsWith('.json')) continue;

              const configPath = path.join(claudeDir, entry);
              try {
                const content = await fs.readFile(configPath, 'utf-8');
                const parsed = JSON.parse(content);

                results.configFiles.push({
                  path: configPath,
                  type: entry.includes('settings') ? 'settings' : 'config',
                  scope: 'project',
                  format: 'json',
                  content: parsed,
                  raw: content,
                  projectName: project.name,
                  projectId: project.id,
                });

                debugLog(`[DEBUG] Added project config: ${configPath}`);
              } catch (err) {
                debugLog(`[DEBUG] Failed to read ${configPath}:`, (err as Error).message);
              }
            }
          } catch (err) {
            debugLog(`[DEBUG] Failed to scan .claude directory:`, (err as Error).message);
          }
        }

        // Add CLAUDE.md as a config file if it exists
        const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
        if (await fileExists(claudeMdPath)) {
          try {
            const content = await fs.readFile(claudeMdPath, 'utf-8');

            results.configFiles.push({
              path: claudeMdPath,
              type: 'claude_md',
              scope: 'project',
              format: 'markdown',
              content: content,
              raw: content,
              projectName: project.name,
              projectId: project.id,
            });

            debugLog(`[DEBUG] Added CLAUDE.md: ${claudeMdPath}`);
          } catch (err) {
            debugLog(`[DEBUG] Failed to read CLAUDE.md:`, (err as Error).message);
          }
        }
      }

      debugLog(`[DEBUG] Total config files: ${results.configFiles.length} (${results.configFiles.filter(f => f.scope === 'global').length} global, ${results.configFiles.filter(f => f.scope === 'project').length} project)`);
    } catch (error) {
      debugLog('Failed to auto-scan projects:', error);
      results.projects = [];
    }

    res.json(results);
  } catch (error) {
    console.error('Error loading data:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Helper function to scan directory for ClaudeCode projects
 */
async function scanDirectoryForProjects(
  dir: string,
  projects: Map<string, any>,
  depth: number,
  maxDepth: number
) {
  if (depth > maxDepth) return;

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const projectPath = path.normalize(path.join(dir, entry.name));

      // Skip if this project is in the excluded list
      if (excludedProjects.has(projectPath)) {
        debugLog(`[DEBUG] Skipping excluded project: ${projectPath}`);
        continue;
      }

      const claudePath = path.join(projectPath, '.claude');
      const claudeMdPath = path.join(projectPath, 'CLAUDE.md');

      try {
        const hasClaude = await fileExists(claudePath);
        const hasClaudeMd = await fileExists(claudeMdPath);

        if (hasClaude || hasClaudeMd) {
          // This is a ClaudeCode project
          const stats = await fs.stat(projectPath);

          // Check if already scanned (using normalized path as key)
          if (!projects.has(projectPath)) {
            projects.set(projectPath, {
              id: projectPath,
              name: entry.name,
              path: projectPath,
              exists: true,
              lastModified: stats.mtime,
              hasClaudeConfig: hasClaude,
              hasClaudeMd: hasClaudeMd,
            });

            debugLog(`[DEBUG] Found project: ${entry.name} at ${projectPath}`);
          }
        } else {
          // Recursively scan subdirectories
          await scanDirectoryForProjects(projectPath, projects, depth + 1, maxDepth);
        }
      } catch (err) {
        // Skip directories we can't access
        continue;
      }
    }
  } catch (err) {
    // Skip directories we can't read
  }
}

/**
 * Read a single configuration file
 */
app.get('/api/config/read', async (req, res) => {
  try {
    const { path: filePath } = req.query;
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'File path is required' });
    }

    const expandedPath = expandPath(filePath);

    if (!(await fileExists(expandedPath))) {
      return res.status(404).json({ error: 'File not found' });
    }

    const content = await fs.readFile(expandedPath, 'utf-8');

    // Determine file type and format
    let type: 'settings' | 'mcp' | 'claude_md' | 'config' = 'config';
    let format: 'json' | 'markdown' = 'json';
    let parsedContent: any = null;

    if (filePath.includes('mcp.json')) {
      type = 'mcp';
      format = 'json';
      parsedContent = JSON.parse(content);
    } else if (filePath.includes('settings.json') || filePath.includes('settings.local.json')) {
      type = 'settings';
      format = 'json';
      parsedContent = JSON.parse(content);
    } else if (filePath.includes('CLAUDE.md')) {
      type = 'claude_md';
      format = 'markdown';
      parsedContent = content; // For markdown, content is the raw text
    } else if (filePath.endsWith('.json')) {
      format = 'json';
      parsedContent = JSON.parse(content);
    } else if (filePath.endsWith('.md')) {
      format = 'markdown';
      parsedContent = content;
    } else {
      // Try to parse as JSON, fallback to raw text
      try {
        parsedContent = JSON.parse(content);
      } catch {
        parsedContent = content;
      }
    }

    res.json({
      path: expandedPath,
      type,
      scope: filePath.includes('.claude') ? 'global' : 'project',
      format,
      content: parsedContent,
      raw: content
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Validate configuration content
 */
app.post('/api/config/validate', async (req, res) => {
  try {
    const { configType, content } = req.body;

    if (!configType || !content) {
      return res.status(400).json({ error: 'configType and content are required' });
    }

    const result = validateConfig(configType, content);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Write a configuration file
 */
app.post('/api/config/write', async (req, res) => {
  try {
    const { path: filePath, content, backup = true } = req.body;

    if (!filePath || !content) {
      return res.status(400).json({ error: 'File path and content are required' });
    }

    const expandedPath = expandPath(filePath);

    // Determine config type
    let configType: 'settings' | 'mcp' | 'claude_md' | 'json' = 'json';
    if (filePath.includes('mcp.json')) configType = 'mcp';
    else if (filePath.includes('settings.json') || filePath.includes('settings.local.json')) configType = 'settings';
    else if (filePath.includes('CLAUDE.md')) configType = 'claude_md';
    else if (filePath.endsWith('.md')) configType = 'claude_md';
    else if (filePath.endsWith('.json')) configType = 'json';

    // Validate content (for markdown files, just check if content is not empty)
    const validation = validateConfig(configType, content);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    // Create backup if requested
    if (backup && await fileExists(expandedPath)) {
      const backupPath = `${expandedPath}.backup`;
      const originalContent = await fs.readFile(expandedPath, 'utf-8');
      await fs.writeFile(backupPath, originalContent);
      debugLog(`[DEBUG] Created backup: ${backupPath}`);
    }

    // Write file
    await fs.writeFile(expandedPath, content, 'utf-8');
    debugLog(`[DEBUG] Wrote file: ${expandedPath}`);

    res.json({
      success: true,
      path: expandedPath,
      warnings: validation.warnings
    });
  } catch (error) {
    debugLog(`[DEBUG] Error writing config: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Toggle MCP server enabled/disabled
 */
app.post('/api/mcp/toggle', async (req, res) => {
  try {
    const { serverId, enabled } = req.body;

    if (!serverId || typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'serverId and enabled are required' });
    }

    const configPath = expandPath('~/.mcp.json');

    if (!(await fileExists(configPath))) {
      return res.status(404).json({ error: 'MCP config not found' });
    }

    const content = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(content);

    if (!config.mcpServers) {
      return res.status(400).json({ error: 'Invalid MCP config format' });
    }

    // Handle both object format (key-value) and array format
    if (Array.isArray(config.mcpServers)) {
      // Array format
      const server = config.mcpServers.find((s: any) => s.id === serverId);
      if (!server) {
        return res.status(404).json({ error: 'Server not found' });
      }
      server.enabled = enabled;
    } else {
      // Object format (key-value)
      const server = config.mcpServers[serverId];
      if (!server) {
        return res.status(404).json({ error: 'Server not found' });
      }
      server.enabled = enabled;
    }

    // Create backup
    await fs.writeFile(`${configPath}.backup`, content);

    // Write back
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Test MCP server connection
 */
app.post('/api/mcp/test', async (req, res) => {
  const startTime = Date.now();
  const { transport, url } = req.body;

  try {
    if (transport === 'http' && url) {
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        return res.json({
          status: 'ok',
          latency,
          lastCheck: new Date()
        });
      } else {
        return res.json({
          status: 'error',
          error: `HTTP ${response.status}`,
          lastCheck: new Date()
        });
      }
    }

    // For stdio, return unknown status
    return res.json({
      status: 'unknown',
      lastCheck: new Date()
    });
  } catch (error) {
    return res.json({
      status: 'error',
      error: (error as Error).message,
      lastCheck: new Date()
    });
  }
});

/**
 * Toggle Skill enabled/disabled
 */
app.post('/api/skill/toggle', async (req, res) => {
  try {
    const { skillId, enabled } = req.body;

    if (!skillId || typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'skillId and enabled are required' });
    }

    const settingsPath = expandPath('~/.claude/settings.json');

    if (!(await fileExists(settingsPath))) {
      return res.status(404).json({ error: 'Settings file not found' });
    }

    const content = await fs.readFile(settingsPath, 'utf-8');
    const config = JSON.parse(content);

    // Initialize disabledSkills array if it doesn't exist
    if (!config.disabledSkills) {
      config.disabledSkills = [];
    }

    // Update disabledSkills array
    if (enabled) {
      config.disabledSkills = config.disabledSkills.filter((id: string) => id !== skillId);
    } else {
      if (!config.disabledSkills.includes(skillId)) {
        config.disabledSkills.push(skillId);
      }
    }

    // Create backup
    await fs.writeFile(`${settingsPath}.backup`, content);

    // Write updated config
    await fs.writeFile(settingsPath, JSON.stringify(config, null, 2), 'utf-8');

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Directories to skip during project scanning
 */
const SKIP_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  'bower_components',
  'dist',
  'build',
  'target',
  'bin',
  'obj',
  '.vs',
  '.vscode',
  'coverage',
  '.next',
  '.nuxt',
  'tmp',
  'temp',
  '$RECYCLE.BIN',
  'System Volume Information',
  'Windows',
  'Program Files',
  'Program Files (x86)',
  'ProgramData',
]);

/**
 * Check if a directory should be skipped
 */
const shouldSkipDirectory = (dirName: string): boolean => {
  return SKIP_DIRECTORIES.has(dirName) || dirName.startsWith('.');
};

/**
 * Check if a full path should be skipped
 */
const shouldSkipPath = (fullPath: string): boolean => {
  const normalizedPath = path.normalize(fullPath);
  const parts = normalizedPath.split(path.sep);

  // Check if any part of the path should be skipped
  for (const part of parts) {
    if (shouldSkipDirectory(part)) {
      return true;
    }
  }

  return false;
};

/**
 * Scan projects directory with improved filtering
 */
const scanProjectsDirectory = async (dir: string, depth = 0, projects: any[] = []): Promise<void> => {
  if (depth > 4) return; // Increased from 3 to 4 for deeper scanning

  // Check if the current directory path should be skipped
  if (shouldSkipPath(dir)) {
    return;
  }

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      // Skip certain directories
      if (shouldSkipDirectory(entry.name)) continue;

      const projectPath = path.normalize(path.join(dir, entry.name));

      // Double-check the full path before proceeding
      if (shouldSkipPath(projectPath)) continue;

      const claudePath = path.join(projectPath, '.claude');
      const claudeMdPath = path.join(projectPath, 'CLAUDE.md');

      const hasClaude = await fileExists(claudePath);
      const hasClaudeMd = await fileExists(claudeMdPath);

      if (hasClaude || hasClaudeMd) {
        // This is a ClaudeCode project
        try {
          const stats = await fs.stat(projectPath);

          projects.push({
            id: projectPath,
            name: entry.name,
            path: projectPath,
            exists: true,
            lastModified: stats.mtime,
            hasClaudeConfig: hasClaude,
            hasClaudeMd: hasClaudeMd
          });
        } catch {
          // Skip if stat fails
        }
      } else {
        // Recursively scan subdirectory
        await scanProjectsDirectory(projectPath, depth + 1, projects);
      }
    }
  } catch (error) {
    // Skip directories we can't read (permission denied, etc.)
    console.error(`[DEBUG] Failed to scan directory ${dir}: ${(error as Error).message}`);
  }
};

app.get('/api/projects/scan', async (req, res) => {
  try {
    const { searchPath } = req.query;
    const projects: any[] = [];
    const scannedPaths: string[] = [];

    // Default scan paths for Windows
    const defaultPaths = ['~', 'D:\\', 'D:\\dev', 'D:\\projects', 'C:\\dev', 'C:\\projects'];

    let pathsToScan: string[];
    if (searchPath && typeof searchPath === 'string') {
      // Support comma or semicolon separated paths
      pathsToScan = searchPath.split(/[;,]/).map(p => p.trim()).filter(Boolean);
    } else {
      pathsToScan = defaultPaths;
    }

    // Scan each path
    for (const searchPath of pathsToScan) {
      try {
        const expandedPath = expandPath(searchPath);
        scannedPaths.push(expandedPath);

        // Check if path exists and is a directory
        const stats = await fs.stat(expandedPath).catch(() => null);
        if (!stats || !stats.isDirectory()) {
          console.error(`[DEBUG] Path does not exist or is not a directory: ${expandedPath}`);
          continue;
        }

        await scanProjectsDirectory(expandedPath, 0, projects);
      } catch (error) {
        console.error(`[DEBUG] Failed to scan ${searchPath}: ${(error as Error).message}`);
      }
    }

    // Remove duplicates based on path
    const uniqueProjects = Array.from(
      new Map(projects.map(p => [p.path, p])).values()
    );

    // Auto-import all found projects (normalize paths to avoid duplicates)
    let importedCount = 0;
    for (const project of uniqueProjects) {
      const normalizedPath = path.normalize(project.path);
      if (!manuallyAddedProjects.has(normalizedPath)) {
        manuallyAddedProjects.add(normalizedPath);
        importedCount++;
      }
    }

    // Save if any new projects were added
    if (importedCount > 0) {
      await saveProjects();
    }

    res.json({
      projects: uniqueProjects,
      scannedPaths,
      count: uniqueProjects.length,
      imported: importedCount
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Get project detail
 */
app.get('/api/project/detail', async (req, res) => {
  try {
    const { path: projectPath } = req.query;

    if (!projectPath || typeof projectPath !== 'string') {
      return res.status(400).json({ error: 'Project path is required' });
    }

    const expandedPath = expandPath(projectPath as string);
    const project: any = {
      path: expandedPath,
      config: null,
      claudeMd: null
    };

    // Load .claude/config.json
    const claudePath = path.join(expandedPath, '.claude');
    if (await fileExists(claudePath)) {
      const configPath = path.join(claudePath, 'config.json');
      if (await fileExists(configPath)) {
        const content = await fs.readFile(configPath, 'utf-8');
        project.config = JSON.parse(content);
      }
    }

    // Load CLAUDE.md
    const claudeMdPath = path.join(expandedPath, 'CLAUDE.md');
    if (await fileExists(claudeMdPath)) {
      project.claudeMd = {
        path: claudeMdPath,
        content: await fs.readFile(claudeMdPath, 'utf-8')
      };
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Manually add a project path
 */
app.post('/api/project/add', async (req, res) => {
  try {
    const { projectPath } = req.body;

    if (!projectPath || typeof projectPath !== 'string') {
      return res.status(400).json({ error: 'Project path is required' });
    }

    const expandedPath = expandPath(projectPath);

    // Check if path exists
    if (!(await fileExists(expandedPath))) {
      return res.status(404).json({ error: 'Path does not exist' });
    }

    // Check if it's a directory
    try {
      const stats = await fs.stat(expandedPath);
      if (!stats.isDirectory()) {
        return res.status(400).json({ error: 'Path must be a directory' });
      }
    } catch (error) {
      return res.status(400).json({ error: 'Invalid path' });
    }

    // Check for ClaudeCode indicators
    const claudePath = path.join(expandedPath, '.claude');
    const claudeMdPath = path.join(expandedPath, 'CLAUDE.md');

    const hasClaude = await fileExists(claudePath);
    const hasClaudeMd = await fileExists(claudeMdPath);

    if (!hasClaude && !hasClaudeMd) {
      return res.status(400).json({
        error: 'Not a ClaudeCode project',
        message: 'Directory must contain .claude/ or CLAUDE.md'
      });
    }

    // Add to manually added projects list (normalize path to avoid duplicates)
    const normalizedPath = path.normalize(expandedPath);

    // Remove from excluded list if it was previously excluded
    if (excludedProjects.has(normalizedPath)) {
      excludedProjects.delete(normalizedPath);
      debugLog(`[DEBUG] Removed ${normalizedPath} from excluded list`);
    }

    manuallyAddedProjects.add(normalizedPath);
    await saveProjects();
    debugLog(`[DEBUG] Manually added project: ${normalizedPath}`);

    // Return project info
    res.json({
      id: expandedPath,
      name: path.basename(expandedPath),
      path: expandedPath,
      exists: true,
      lastModified: (await fs.stat(expandedPath)).mtime,
      hasClaudeConfig: hasClaude,
      hasClaudeMd: hasClaudeMd,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Import multiple projects from scan results
 */
app.post('/api/projects/import', async (req, res) => {
  try {
    const { projects } = req.body;

    if (!Array.isArray(projects)) {
      return res.status(400).json({ error: 'projects must be an array' });
    }

    let addedCount = 0;
    let skippedCount = 0;
    const results: any[] = [];

    for (const project of projects) {
      const projectPath = project.path || project;

      if (!projectPath || typeof projectPath !== 'string') {
        skippedCount++;
        continue;
      }

      // Skip if already added
      if (manuallyAddedProjects.has(projectPath)) {
        skippedCount++;
        results.push({
          path: projectPath,
          status: 'skipped',
          reason: 'Already added'
        });
        continue;
      }

      // Verify the project still exists
      if (!(await fileExists(projectPath))) {
        skippedCount++;
        results.push({
          path: projectPath,
          status: 'skipped',
          reason: 'Path does not exist'
        });
        continue;
      }

      // Add to manually added projects (normalize path)
      const normalizedPath = path.normalize(projectPath);
      manuallyAddedProjects.add(normalizedPath);
      addedCount++;
      results.push({
        path: normalizedPath,
        status: 'added'
      });
    }

    // Save to file
    await saveProjects();

    res.json({
      added: addedCount,
      skipped: skippedCount,
      total: projects.length,
      results
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Remove a project from the list (does not delete files)
 */
app.post('/api/projects/remove', async (req, res) => {
  try {
    const { projectPath } = req.body;

    if (!projectPath) {
      return res.status(400).json({ error: 'Project path is required' });
    }

    // Normalize path for consistent comparison
    const normalizedPath = path.normalize(projectPath);

    debugLog(`[DEBUG] Attempting to remove project: ${normalizedPath}`);

    // Remove from manually added projects (if present)
    const wasInIncluded = manuallyAddedProjects.has(normalizedPath);
    if (wasInIncluded) {
      manuallyAddedProjects.delete(normalizedPath);
    }

    // Add to excluded projects to prevent it from being re-scanned
    excludedProjects.add(normalizedPath);

    // Save changes
    await saveProjects();

    debugLog(`[DEBUG] Successfully removed project: ${normalizedPath}`);
    debugLog(`[DEBUG] Added to excluded list. Total excluded: ${excludedProjects.size}`);

    res.json({
      success: true,
      message: 'Project removed from list',
      path: normalizedPath
    });
  } catch (error) {
    debugLog(`[DEBUG] Error removing project: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

// ==================== MCP Tools & Resources ====================

/**
 * Get MCP tools for a server
 */
app.get('/api/mcp/tools/:serverId', async (req, res) => {
  try {
    const { serverId } = req.params;

    // Load MCP config to get server details
    const mcpPath = expandPath('~/.mcp.json');
    if (!(await fileExists(mcpPath))) {
      return res.status(404).json({ error: 'MCP config not found' });
    }

    const content = await fs.readFile(mcpPath, 'utf-8');
    const mcpConfig = JSON.parse(content);

    const mcpServersObj = mcpConfig.mcpServers || {};
    const serverConfig: any = mcpServersObj[serverId] || mcpServersObj[`mcpServers.${serverId}`];

    if (!serverConfig) {
      return res.status(404).json({ error: 'Server not found' });
    }

    const transport = serverConfig.command ? 'stdio' : 'http';
    const tools = await getMcpTools(serverId, {
      transport,
      command: serverConfig.command,
      args: serverConfig.args,
      url: serverConfig.url
    });

    res.json(tools);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Get MCP resources for a server
 */
app.get('/api/mcp/resources/:serverId', async (req, res) => {
  try {
    const { serverId } = req.params;

    // Load MCP config
    const mcpPath = expandPath('~/.mcp.json');
    if (!(await fileExists(mcpPath))) {
      return res.status(404).json({ error: 'MCP config not found' });
    }

    const content = await fs.readFile(mcpPath, 'utf-8');
    const mcpConfig = JSON.parse(content);

    const mcpServersObj = mcpConfig.mcpServers || {};
    const serverConfig: any = mcpServersObj[serverId] || mcpServersObj[`mcpServers.${serverId}`];

    if (!serverConfig) {
      return res.status(404).json({ error: 'Server not found' });
    }

    const resources = await getMcpResources(serverId, serverConfig);

    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Test an MCP tool
 */
app.post('/api/mcp/test-tool/:serverId', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { toolName, args } = req.body;

    if (!toolName) {
      return res.status(400).json({ error: 'toolName is required' });
    }

    // Load server config
    const mcpPath = expandPath('~/.mcp.json');
    const content = await fs.readFile(mcpPath, 'utf-8');
    const mcpConfig = JSON.parse(content);

    const mcpServersObj = mcpConfig.mcpServers || {};
    const serverConfig: any = mcpServersObj[serverId] || mcpServersObj[`mcpServers.${serverId}`];

    const transport = serverConfig?.command ? 'stdio' : 'http';

    const result = await testMcpTool(serverId, toolName, args, {
      transport,
      command: serverConfig?.command,
      args: serverConfig?.args,
      url: serverConfig?.url
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Get health check history
 */
app.get('/api/mcp/health-history/:serverId', (req, res) => {
  try {
    const { serverId } = req.params;
    const history = getHealthHistory(serverId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ==================== Skill Management ====================

/**
 * Get skill templates
 */
app.get('/api/skills/templates', (req, res) => {
  try {
    const templates = getSkillTemplates();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Create a new skill
 */
app.post('/api/skills/create', async (req, res) => {
  try {
    const { scope, projectPath, skill } = req.body;

    if (!scope || !skill || !skill.id) {
      return res.status(400).json({ error: 'scope, skill.id, and skill are required' });
    }

    await createSkill(scope, projectPath, skill);

    res.json({ success: true, path: skill.id });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Validate skill frontmatter
 */
app.post('/api/skills/validate-frontmatter', (req, res) => {
  try {
    const { frontmatter } = req.body;

    if (!frontmatter) {
      return res.status(400).json({ error: 'frontmatter is required' });
    }

    let parsedFrontmatter = frontmatter;

    // If frontmatter is a string with --- delimiters, use parseSkillFrontmatter
    if (typeof frontmatter === 'string' && frontmatter.includes('---')) {
      try {
        parsedFrontmatter = parseSkillFrontmatter(frontmatter);
        if (!parsedFrontmatter) {
          return res.status(400).json({ error: 'Invalid frontmatter format' });
        }
      } catch (error: any) {
        return res.status(400).json({ error: 'Invalid frontmatter format', details: (error as Error).message });
      }
    } else if (typeof frontmatter === 'string') {
      // Try to parse as YAML or JSON
      try {
        parsedFrontmatter = JSON.parse(frontmatter);
      } catch {
        try {
          parsedFrontmatter = yamlLoad(frontmatter);
        } catch {
          return res.status(400).json({ error: 'Invalid frontmatter format' });
        }
      }
    }

    const result = validateSkillFrontmatter(parsedFrontmatter);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Parse skill frontmatter from SKILL.md content
 */
app.post('/api/skills/parse-frontmatter', (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }

    const frontmatter = parseSkillFrontmatter(content);
    res.json({ frontmatter });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Test a skill
 */
app.post('/api/skills/test/:skillId', async (req, res) => {
  try {
    const { skillId } = req.params;
    const { arguments: args } = req.body;

    const result = await testSkill(skillId, args || []);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ==================== Wishlist API ====================

/**
 * Get all wishlist data
 */
app.get('/api/wishlist', (req, res) => {
  try {
    res.json(wishlistData);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Add a wishlist item
 */
app.post('/api/wishlist/add', async (req, res) => {
  try {
    const { type, title, notes } = req.body;

    if (!type || !title) {
      return res.status(400).json({ error: 'type and title are required' });
    }

    if (type !== 'mcp' && type !== 'skills' && type !== 'subagents') {
      return res.status(400).json({ error: 'type must be "mcp", "skills", or "subagents"' });
    }

    const newItem: WishlistItem = {
      id: generateId(),
      title,
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completed: false,
    };

    wishlistData[type].push(newItem);
    await saveWishlist();

    res.json({ success: true, item: newItem });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Update a wishlist item
 */
app.put('/api/wishlist/update', async (req, res) => {
  try {
    const { type, itemId, title, notes, completed } = req.body;

    if (!type || !itemId) {
      return res.status(400).json({ error: 'type and itemId are required' });
    }

    if (type !== 'mcp' && type !== 'skills' && type !== 'subagents') {
      return res.status(400).json({ error: 'type must be "mcp", "skills", or "subagents"' });
    }

    const itemIndex = wishlistData[type].findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Update fields
    if (title !== undefined) wishlistData[type][itemIndex].title = title;
    if (notes !== undefined) wishlistData[type][itemIndex].notes = notes;
    if (completed !== undefined) wishlistData[type][itemIndex].completed = completed;
    wishlistData[type][itemIndex].updatedAt = new Date().toISOString();

    await saveWishlist();

    res.json({ success: true, item: wishlistData[type][itemIndex] });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Remove a wishlist item
 */
app.delete('/api/wishlist/remove', async (req, res) => {
  try {
    const { type, itemId } = req.body;

    if (!type || !itemId) {
      return res.status(400).json({ error: 'type and itemId are required' });
    }

    if (type !== 'mcp' && type !== 'skills' && type !== 'subagents') {
      return res.status(400).json({ error: 'type must be "mcp", "skills", or "subagents"' });
    }

    const itemIndex = wishlistData[type].findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found' });
    }

    wishlistData[type].splice(itemIndex, 1);
    await saveWishlist();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ==================== SubAgents ====================

/**
 * Get all subagents
 */
app.get('/api/subagents', async (req, res) => {
  try {
    const { projectPath } = req.query;

    const subagents = await loadAllSubAgents(projectPath as string | undefined);

    res.json({ subagents });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Create or update a subagent
 */
app.post('/api/subagents/save', async (req, res) => {
  try {
    const { id, scope, projectPath, tools, disallowedTools, skills, ...config } = req.body;

    if (!config.name) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (!config.description) {
      return res.status(400).json({ error: 'description is required' });
    }
    if (!scope || (scope !== 'user' && scope !== 'project')) {
      return res.status(400).json({ error: 'scope must be "user" or "project"' });
    }

    // Convert comma-separated strings to arrays (handle if already arrays)
    const toolsArray = Array.isArray(tools) ? tools : (tools ? String(tools).split(',').map((t: string) => t.trim()).filter(Boolean) : []);
    const disallowedToolsArray = Array.isArray(disallowedTools) ? disallowedTools : (disallowedTools ? String(disallowedTools).split(',').map((t: string) => t.trim()).filter(Boolean) : []);
    const skillsArray = Array.isArray(skills) ? skills : (skills ? String(skills).split(',').map((s: string) => s.trim()).filter(Boolean) : []);

    // Build config with arrays
    const subagentConfig = {
      ...config,
      tools: toolsArray,
      disallowedTools: disallowedToolsArray,
      skills: skillsArray,
    };

    // Validate config
    const validation = validateSubAgentConfig(subagentConfig);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors.join(', ') });
    }

    // Save subagent
    const subagent = await saveSubAgent(
      {
        ...subagentConfig,
        id: id || config.name,
      },
      scope,
      scope === 'project' ? projectPath : undefined
    );
    res.json({ success: true, subagent });
  } catch (error) {
    console.error('[API] Error saving subagent:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Delete a subagent
 */
app.delete('/api/subagents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { scope, projectPath } = req.body;

    if (!scope || (scope !== 'user' && scope !== 'project')) {
      return res.status(400).json({ error: 'scope must be "user" or "project"' });
    }

    await deleteSubAgent(
      id,
      scope,
      scope === 'project' ? projectPath : undefined
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Get subagent file content
 */
app.get('/api/subagents/:id/content', async (req, res) => {
  try {
    const { id } = req.params;
    const { scope, projectPath } = req.query;

    if (!scope || (scope !== 'user' && scope !== 'project')) {
      return res.status(400).json({ error: 'scope must be "user" or "project"' });
    }

    const agentsDir = scope === 'user'
      ? path.join(os.homedir(), '.claude', 'agents')
      : path.join(projectPath as string, '.claude', 'agents');

    const filePath = path.join(agentsDir, `${id}.md`);
    const content = await fs.readFile(filePath, 'utf-8');

    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ==================== Rules ====================

/**
 * Get all rules
 */
app.get('/api/rules/all', async (req, res) => {
  try {
    const rulesPath = expandPath('~/.claude/rules');

    if (!(await fileExists(rulesPath))) {
      return res.json([]);
    }

    const entries = await fs.readdir(rulesPath);
    const rules = [];

    for (const entryName of entries) {
      if (!entryName.endsWith('.md')) continue;

      const rulePath = path.join(rulesPath, entryName);
      const language = entryName.replace('.md', '');

      try {
        const content = await fs.readFile(rulePath, 'utf-8');
        const stats = await fs.stat(rulePath);

        rules.push({
          id: language,
          name: language,
          language: language,
          path: rulePath,
          scope: 'global',
          enabled: true,
          content,
          lastModified: stats.mtime
        });
      } catch (err) {
        console.error(`Failed to read rule ${entryName}:`, err);
      }
    }

    res.json(rules);
  } catch (error) {
    console.error('Error loading rules:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Create a new rule
 */
app.post('/api/rules/create', async (req, res) => {
  try {
    const { language, content } = req.body;

    if (!language) {
      return res.status(400).json({ error: 'language is required' });
    }

    const rulesPath = expandPath('~/.claude/rules');

    // Create rules directory if it doesn't exist
    if (!(await fileExists(rulesPath))) {
      await fs.mkdir(rulesPath, { recursive: true });
    }

    const rulePath = path.join(rulesPath, `${language}.md`);

    // Check if rule already exists
    if (await fileExists(rulePath)) {
      return res.status(409).json({ error: `Rule for language "${language}" already exists` });
    }

    // Write rule file
    await fs.writeFile(rulePath, content || `# ${language} Coding Rules\n\nAdd your coding rules here.\n`, 'utf-8');

    res.json({
      id: language,
      name: language,
      language: language,
      path: rulePath,
      scope: 'global',
      enabled: true,
      content: content || `# ${language} Coding Rules\n\nAdd your coding rules here.\n`
    });
  } catch (error) {
    console.error('Error creating rule:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Update a rule
 */
app.post('/api/rules/update', async (req, res) => {
  try {
    const { language, content } = req.body;

    if (!language) {
      return res.status(400).json({ error: 'language is required' });
    }

    if (content === undefined) {
      return res.status(400).json({ error: 'content is required' });
    }

    const rulePath = path.join(expandPath('~/.claude/rules'), `${language}.md`);

    // Check if rule exists
    if (!(await fileExists(rulePath))) {
      return res.status(404).json({ error: `Rule for language "${language}" not found` });
    }

    // Create backup
    const backupPath = rulePath + '.backup';
    try {
      const originalContent = await fs.readFile(rulePath, 'utf-8');
      await fs.writeFile(backupPath, originalContent, 'utf-8');
    } catch (err) {
      console.warn(`Failed to create backup:`, err);
    }

    // Write updated content
    await fs.writeFile(rulePath, content, 'utf-8');

    res.json({
      id: language,
      name: language,
      language: language,
      path: rulePath,
      scope: 'global',
      enabled: true,
      content
    });
  } catch (error) {
    console.error('Error updating rule:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Delete a rule
 */
app.delete('/api/rules/delete', async (req, res) => {
  try {
    const { language } = req.body;

    if (!language) {
      return res.status(400).json({ error: 'language is required' });
    }

    const rulePath = path.join(expandPath('~/.claude/rules'), `${language}.md`);

    // Check if rule exists
    if (!(await fileExists(rulePath))) {
      return res.status(404).json({ error: `Rule for language "${language}" not found` });
    }

    // Create backup before deleting
    const backupPath = rulePath + '.backup';
    try {
      const content = await fs.readFile(rulePath, 'utf-8');
      await fs.writeFile(backupPath, content, 'utf-8');
    } catch (err) {
      console.warn(`Failed to create backup:`, err);
    }

    // Delete rule file
    await fs.unlink(rulePath);

    res.json({ success: true, message: `Rule "${language}" deleted successfully` });
  } catch (error) {
    console.error('Error deleting rule:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// ==================== Commands ====================

/**
 * Get all commands (both built-in and custom)
 */
app.get('/api/commands/all', async (req, res) => {
  try {
    const commands = [];
    const commandsPath = expandPath('~/.claude/commands');

    // Define built-in commands
    const builtinCommands = [
      { id: 'add-dir', name: 'Add Directory', description: 'Add a directory to the context' },
      { id: 'agents', name: 'Agents', description: 'List and manage available agents' },
      { id: 'bug', name: 'Bug', description: 'Help investigate and fix bugs' },
      { id: 'clear', name: 'Clear', description: 'Clear the conversation context' },
      { id: 'compact', name: 'Compact', description: 'Compact the context window' },
      { id: 'commit', name: 'Commit', description: 'Create a git commit' },
      { id: 'context', name: 'Context', description: 'View current context information' },
      { id: 'help', name: 'Help', description: 'Show help information' },
      { id: 'preview', name: 'Preview', description: 'Preview files or changes' },
      { id: 'test', name: 'Test', description: 'Run tests' },
      { id: 'review', name: 'Review', description: 'Review code changes' },
      { id: 'refactor', name: 'Refactor', description: 'Refactor code' },
      { id: 'document', name: 'Document', description: 'Generate documentation' },
      { id: 'explain', name: 'Explain', description: 'Explain code or concepts' },
      { id: 'fix', name: 'Fix', description: 'Fix code issues' },
    ];

    // Add built-in commands
    for (const cmd of builtinCommands) {
      commands.push({
        id: cmd.id,
        name: cmd.name,
        path: '',
        scope: 'builtin',
        enabled: true,
        builtin: true,
        description: cmd.description
      });
    }

    // Scan custom commands directory
    if (await fileExists(commandsPath)) {
      const entries = await fs.readdir(commandsPath);

      for (const entryName of entries) {
        if (!entryName.endsWith('.md')) continue;

        const commandPath = path.join(commandsPath, entryName);
        const commandId = entryName.replace('.md', '');

        try {
          const content = await fs.readFile(commandPath, 'utf-8');
          const stats = await fs.stat(commandPath);

          // Extract description (supports YAML frontmatter and Markdown title)
          const description = extractCommandDescription(content);

          commands.push({
            id: commandId,
            name: commandId,
            path: commandPath,
            scope: 'global',
            enabled: true,
            builtin: false,
            content,
            description,
            lastModified: stats.mtime
          });
        } catch (err) {
          console.error(`Failed to read command ${entryName}:`, err);
        }
      }
    }

    // Scan plugin commands directories
    const pluginsBasePaths = [
      expandPath('~/.claude/plugins/marketplaces'),
      expandPath('~/.claude/plugins/cache'),
    ];

    for (const pluginsBasePath of pluginsBasePaths) {
      try {
        if (!(await fileExists(pluginsBasePath))) {
          continue;
        }

        // Read all plugin directories
        const pluginDirs = await fs.readdir(pluginsBasePath);

        for (const pluginDir of pluginDirs) {
          const pluginPath = path.join(pluginsBasePath, pluginDir);
          const pluginCommandsPath = path.join(pluginPath, 'commands');

          // Skip if commands directory doesn't exist
          if (!(await fileExists(pluginCommandsPath))) {
            continue;
          }

          debugLog(`[DEBUG] Scanning plugin commands: ${pluginCommandsPath}`);

          try {
            const entries = await fs.readdir(pluginCommandsPath);

            for (const entryName of entries) {
              if (!entryName.endsWith('.md')) continue;

              const commandPath = path.join(pluginCommandsPath, entryName);
              const commandId = entryName.replace('.md', '');

              // Skip if command already exists (prioritize user commands)
              if (commands.some(c => c.id === commandId)) {
                debugLog(`[DEBUG] Skipping duplicate command: ${commandId} from ${pluginDir}`);
                continue;
              }

              try {
                const content = await fs.readFile(commandPath, 'utf-8');
                const stats = await fs.stat(commandPath);

                // Extract description (supports YAML frontmatter and Markdown title)
                const description = extractCommandDescription(content);

                debugLog(`[DEBUG] Adding plugin command: ${commandId} from ${pluginDir}`);
                commands.push({
                  id: commandId,
                  name: commandId,
                  path: commandPath,
                  scope: 'global',
                  enabled: true,
                  builtin: false,
                  content,
                  description,
                  lastModified: stats.mtime
                });
              } catch (err) {
                console.error(`Failed to read command ${entryName}:`, err);
              }
            }
          } catch (err) {
            debugLog(`[DEBUG] Failed to read plugin commands dir:`, (err as Error).message);
          }
        }
      } catch (err) {
        debugLog(`[DEBUG] Failed to scan plugin base path:`, (err as Error).message);
      }
    }

    res.json(commands);
  } catch (error) {
    console.error('Error loading commands:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Create a new command
 */
app.post('/api/commands/create', async (req, res) => {
  try {
    const { commandId, content } = req.body;

    if (!commandId) {
      return res.status(400).json({ error: 'commandId is required' });
    }

    // Validate commandId (no special characters except hyphens)
    if (!/^[a-z0-9-]+$/.test(commandId)) {
      return res.status(400).json({ error: 'commandId must contain only lowercase letters, numbers, and hyphens' });
    }

    const commandsPath = expandPath('~/.claude/commands');

    // Create commands directory if it doesn't exist
    if (!(await fileExists(commandsPath))) {
      await fs.mkdir(commandsPath, { recursive: true });
    }

    const commandPath = path.join(commandsPath, `${commandId}.md`);

    // Check if command already exists
    if (await fileExists(commandPath)) {
      return res.status(409).json({ error: `Command "${commandId}" already exists` });
    }

    // Write command file
    const defaultContent = content || `# ${commandId}

Description of what this command does.
`;
    await fs.writeFile(commandPath, defaultContent, 'utf-8');

    // Extract description (supports YAML frontmatter and Markdown title)
    const description = extractCommandDescription(defaultContent);

    res.json({
      id: commandId,
      name: commandId,
      path: commandPath,
      scope: 'global',
      enabled: true,
      builtin: false,
      content: defaultContent,
      description
    });
  } catch (error) {
    console.error('Error creating command:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Update a command
 */
app.post('/api/commands/update', async (req, res) => {
  try {
    const { commandId, content } = req.body;

    if (!commandId) {
      return res.status(400).json({ error: 'commandId is required' });
    }

    if (content === undefined) {
      return res.status(400).json({ error: 'content is required' });
    }

    const commandPath = path.join(expandPath('~/.claude/commands'), `${commandId}.md`);

    // Check if command exists
    if (!(await fileExists(commandPath))) {
      return res.status(404).json({ error: `Command "${commandId}" not found` });
    }

    // Create backup
    const backupPath = commandPath + '.backup';
    try {
      const originalContent = await fs.readFile(commandPath, 'utf-8');
      await fs.writeFile(backupPath, originalContent, 'utf-8');
    } catch (err) {
      console.warn(`Failed to create backup:`, err);
    }

    // Write updated content
    await fs.writeFile(commandPath, content, 'utf-8');

    // Extract description (supports YAML frontmatter and Markdown title)
    const description = extractCommandDescription(content);

    res.json({
      id: commandId,
      name: commandId,
      path: commandPath,
      scope: 'global',
      enabled: true,
      builtin: false,
      content,
      description
    });
  } catch (error) {
    console.error('Error updating command:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Delete a command
 */
app.delete('/api/commands/delete', async (req, res) => {
  try {
    const { commandId } = req.body;

    if (!commandId) {
      return res.status(400).json({ error: 'commandId is required' });
    }

    const commandPath = path.join(expandPath('~/.claude/commands'), `${commandId}.md`);

    // Check if command exists
    if (!(await fileExists(commandPath))) {
      return res.status(404).json({ error: `Command "${commandId}" not found` });
    }

    // Create backup before deleting
    const backupPath = commandPath + '.backup';
    try {
      const content = await fs.readFile(commandPath, 'utf-8');
      await fs.writeFile(backupPath, content, 'utf-8');
    } catch (err) {
      console.warn(`Failed to create backup:`, err);
    }

    // Delete command file
    await fs.unlink(commandPath);

    res.json({ success: true, message: `Command "${commandId}" deleted successfully` });
  } catch (error) {
    console.error('Error deleting command:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// ==================== Environment Variables ====================

/**
 * Expand environment variables
 */
app.post('/api/env/expand', (req, res) => {
  try {
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'value is required' });
    }

    const expanded = expandEnvVars(value);
    const references = findEnvVarReferences(value);

    res.json({
      expanded,
      references,
      original: value
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ==================== Start Server ====================

console.log('[INFO] Server code loaded, about to start listening...');

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📁 Home directory: ${os.homedir()}`);
  console.log('[INFO] Server is ready to accept requests');
});
