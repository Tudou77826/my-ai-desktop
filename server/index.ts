// ==================== Node.js Backend Server ====================
// Express server for file system operations

import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { createWriteStream } from 'fs';

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

// ==================== Utility Functions ====================

/**
 * Expand ~ to home directory
 */
function expandPath(filePath: string): string {
  if (filePath.startsWith('~')) {
    return filePath.replace('~', os.homedir());
  }
  return filePath;
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

    // Projects scanning - TODO
    results.projects = [];

    res.json(results);
  } catch (error) {
    console.error('Error loading data:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

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
    const parsed = JSON.parse(content);

    res.json({
      path: expandedPath,
      type: filePath.includes('mcp.json') ? 'mcp' : 'settings',
      scope: filePath.includes('.claude') ? 'global' : 'project',
      format: 'json',
      content: parsed,
      raw: content
    });
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

    // Create backup if requested
    if (backup && await fileExists(expandedPath)) {
      const backupPath = `${expandedPath}.backup`;
      const originalContent = await fs.readFile(expandedPath, 'utf-8');
      await fs.writeFile(backupPath, originalContent);
    }

    // Validate JSON
    try {
      JSON.parse(content);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    // Write file
    await fs.writeFile(expandedPath, content, 'utf-8');

    res.json({ success: true, path: expandedPath });
  } catch (error) {
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

    if (!config.mcpServers || !Array.isArray(config.mcpServers)) {
      return res.status(400).json({ error: 'Invalid MCP config format' });
    }

    const server = config.mcpServers.find((s: any) => s.id === serverId);
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    server.enabled = enabled;

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

// ==================== Start Server ====================

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📁 Home directory: ${os.homedir()}`);
});
