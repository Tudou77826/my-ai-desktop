// ==================== Node.js Backend Server ====================
// Express server for file system operations

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { createWriteStream, writeFile } from 'fs';
import { validateConfig } from './validator';
import {
  getMcpTools,
  getMcpResources,
  testMcpTool,
  getHealthHistory,
  addHealthCheckPoint
} from './handlers/mcp-tools';
import {
  parseSkillFrontmatter,
  validateSkillFrontmatter,
  createSkill,
  testSkill,
  getSkillTemplates
} from './handlers/skill-manager';
import { expandEnvVars, expandEnvVarsInObject, findEnvVarReferences } from './handlers/env-expander';

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
// Store manually added projects in a file
const MANUAL_PROJECTS_FILE = path.join(os.homedir(), '.claude-config-manager-projects.json');

let manuallyAddedProjects = new Set<string>();

// Load manually added projects from file on startup
async function loadManualProjects() {
  try {
    if (await fileExists(MANUAL_PROJECTS_FILE)) {
      const content = await fs.readFile(MANUAL_PROJECTS_FILE, 'utf-8');
      const projects = JSON.parse(content);
      // Normalize all paths to avoid duplicates due to different path formats
      const normalizedProjects = projects.map((p: string) => path.normalize(p));
      manuallyAddedProjects = new Set(normalizedProjects);
      debugLog(`[DEBUG] Loaded ${manuallyAddedProjects.size} manual projects from file`);
      // Debug: print first few paths
      const samplePaths = Array.from(manuallyAddedProjects).slice(0, 3);
      debugLog(`[DEBUG] Sample paths: ${JSON.stringify(samplePaths)}`);
    }
  } catch (error) {
    debugLog('[DEBUG] Failed to load manual projects:', (error as Error).message);
  }
}

// Save manually added projects to file
async function saveManualProjects() {
  try {
    // Normalize all paths before saving to avoid duplicates
    const projects = Array.from(manuallyAddedProjects).map(p => path.normalize(p));
    // Remove duplicates after normalization
    const uniqueProjects = Array.from(new Set(projects));
    await fs.writeFile(MANUAL_PROJECTS_FILE, JSON.stringify(uniqueProjects, null, 2), 'utf-8');
    debugLog(`[DEBUG] Saved ${uniqueProjects.length} manual projects to file`);
  } catch (error) {
    debugLog('[DEBUG] Failed to save manual projects:', (error as Error).message);
  }
}

// Load on startup
loadManualProjects();

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

// ==================== API Routes ====================

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
      configFiles: []
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
          enabled: true,
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

      // Save all found projects to manual projects list for persistence
      let needsSave = false;
      for (const project of results.projects) {
        const normalizedPath = path.normalize(project.path);
        if (!manuallyAddedProjects.has(normalizedPath)) {
          manuallyAddedProjects.add(normalizedPath);
          needsSave = true;
        }
      }
      if (needsSave) {
        await saveManualProjects();
      }

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
      await saveManualProjects();
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
    manuallyAddedProjects.add(normalizedPath);
    await saveManualProjects();
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
    await saveManualProjects();

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
    debugLog(`[DEBUG] Current projects in Set: ${Array.from(manuallyAddedProjects).slice(0, 5).join(', ')}`);

    // Remove from manually added projects
    if (manuallyAddedProjects.has(normalizedPath)) {
      manuallyAddedProjects.delete(normalizedPath);
      await saveManualProjects();

      debugLog(`[DEBUG] Successfully removed project: ${normalizedPath}`);
      debugLog(`[DEBUG] Remaining projects: ${manuallyAddedProjects.size}`);

      res.json({
        success: true,
        message: 'Project removed from list',
        path: normalizedPath
      });
    } else {
      debugLog(`[DEBUG] Project not found in list: ${normalizedPath}`);
      res.status(404).json({ error: 'Project not found in list' });
    }
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
          parsedFrontmatter = require('js-yaml').load(frontmatter);
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

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📁 Home directory: ${os.homedir()}`);
});
