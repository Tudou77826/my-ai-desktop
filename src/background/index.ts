// ==================== Backend API for Neutralino ====================
// This file runs in Node.js context and handles all file operations

import type { AppData, ConfigFile, Skill, MCPServer, Project, HealthStatus, ValidationResult } from '../types';

/**
 * API Handler - All functions exposed to frontend
 */
export const api = {
  // ==================== Data Loading ====================

  /**
   * Load all ClaudeCode configuration data
   */
  async loadAllData(): Promise<AppData> {
    try {
      // Try to load global configs
      let globalConfig: ConfigFile | null = null;
      let mcpConfig: ConfigFile | null = null;
      let skills: Skill[] = [];

      try {
        globalConfig = await this.readConfig('~/.claude/settings.json');
      } catch (e) {
        console.log('Global settings not found:', e);
      }

      try {
        mcpConfig = await this.readConfig('~/.mcp.json');
      } catch (e) {
        console.log('MCP config not found:', e);
      }

      try {
        skills = await this.scanSkillsDirectory();
      } catch (e) {
        console.log('Failed to scan skills:', e);
      }

      // For now, return empty projects array
      // TODO: Implement project scanning
      const projects: Project[] = [];

      return {
        skills,
        mcpServers: mcpConfig?.content?.mcpServers || [],
        projects,
        configFiles: [globalConfig, mcpConfig].filter((c): c is ConfigFile => c !== null),
      };
    } catch (error) {
      console.error('Error loading data:', error);
      // Return empty data structure on error
      return {
        skills: [],
        mcpServers: [],
        projects: [],
        configFiles: [],
      };
    }
  },

  /**
   * Refresh all data (reload from disk)
   */
  async refreshData(): Promise<AppData> {
    return this.loadAllData();
  },

  // ==================== File Operations ====================

  /**
   * Read a configuration file
   */
  async readConfig(path: string): Promise<ConfigFile> {
    // Browser implementation - return mock data
    // In production with Neutralino, this would use the filesystem API
    return {
      path: this.expandPath(path),
      type: this.inferConfigType(path),
      scope: this.inferScope(path),
      format: 'json',
      content: {},
      raw: '{}',
    };
  },

  /**
   * Write a configuration file with optional backup
   */
  async writeConfig(path: string, content: string, _backup: boolean = true): Promise<void> {
    // Mock implementation for browser development
    console.log('Mock writeConfig:', path, content.substring(0, 100) + '...');
    return;

    // Real implementation for Neutralino (commented out for browser development)
    // // @ts-ignore
    // const { filesystem } = await import('@neutralinojs/lib');
    // const expandedPath = this.expandPath(path);
    //
    // // Create backup if requested
    // if (backup && (await filesystem.fileExists(expandedPath))) {
    //   const backupPath = `${expandedPath}.backup`;
    //   const originalContent = await filesystem.readFile(expandedPath);
    //   await filesystem.writeFile(backupPath, originalContent);
    // }
    //
    // // Validate JSON if it's a JSON file
    // if (path.endsWith('.json')) {
    //   try {
    //     JSON.parse(content);
    //   } catch (error) {
    //     throw new Error(`Invalid JSON: ${(error as Error).message}`);
    //   }
    // }
    //
    // // Write file
    // await filesystem.writeFile(expandedPath, content);
  },

  // ==================== Validation & Preview ====================

  /**
   * Validate configuration
   */
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
      return { valid: false, errors: [(error as Error).message] };
    }
  },

  /**
   * Generate diff preview for changes
   */
  async previewChanges(path: string, newContent: string): Promise<string> {
    try {
      const oldContent = await this.readConfig(path);
      return this.generateDiff(oldContent.raw || '', newContent);
    } catch (error) {
      // If file doesn't exist, show all new content as additions
      return newContent.split('\n').map((line) => `+ ${line}`).join('\n');
    }
  },

  // ==================== Toggles ====================

  /**
   * Toggle skill enabled/disabled
   */
  async toggleSkill(skillId: string, enabled: boolean): Promise<void> {
    // For now, this is a placeholder
    // In real implementation, would modify ~/.claude/settings.json
    console.log(`Toggle skill ${skillId}: ${enabled}`);
  },

  /**
   * Toggle MCP server enabled/disabled
   */
  async toggleMcpServer(serverId: string, enabled: boolean): Promise<void> {
    const configPath = '~/.mcp.json';
    const config = await this.readConfig(configPath);

    if (config.content && config.content.mcpServers) {
      const server = config.content.mcpServers.find((s: any) => s.id === serverId);
      if (server) {
        server.enabled = enabled;
        await this.writeConfig(configPath, JSON.stringify(config.content, null, 2), true);
      }
    }
  },

  // ==================== MCP Testing ====================

  /**
   * Test MCP server connection
   */
  async testMcpConnection(server: MCPServer): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      if (server.transport === 'http' && server.config.url) {
        // For HTTP transport, try to fetch the URL
        try {
          const response = await fetch(server.config.url, {
            method: 'GET',
            signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined,
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
        } catch (fetchError) {
          return {
            status: 'error',
            error: (fetchError as Error).message,
            lastCheck: new Date(),
          };
        }
      }

      // For stdio, return unknown status
      return {
        status: 'unknown',
        lastCheck: new Date(),
      };
    } catch (error) {
      return {
        status: 'error',
        error: (error as Error).message,
        lastCheck: new Date(),
      };
    }
  },

  // ==================== Utility Functions ====================

  /**
   * Expand ~ to home directory
   */
  expandPath(path: string): string {
    // Mock implementation for browser
    if (typeof window !== 'undefined') {
      return path;
    }
    // Real implementation for Node.js
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    return path.replace(/^~\//, `${homeDir}/`);
  },

  /**
   * Parse JSON safely
   */
  parseJSON(raw: string): any {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * Infer config type from path
   */
  inferConfigType(path: string): 'settings' | 'mcp' | 'claude_md' {
    if (path.includes('mcp.json')) return 'mcp';
    if (path.includes('settings.json')) return 'settings';
    if (path.includes('CLAUDE.md')) return 'claude_md';
    return 'settings';
  },

  /**
   * Infer scope from path
   */
  inferScope(path: string): 'global' | 'project' {
    if (path.includes('/.claude/') || path.includes('\\.claude\\')) return 'project';
    return 'global';
  },

  /**
   * Generate simple diff
   */
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

  /**
   * Scan skills directory
   */
  async scanSkillsDirectory(): Promise<Skill[]> {
    // Mock implementation for browser development
    return [
      {
        id: 'commit',
        path: '~/.claude/skills/commit',
        scope: 'global',
        enabled: true,
        metadata: {
          name: 'Git Commit',
          description: 'Git 提交管理技能',
        },
      },
      {
        id: 'pr-review',
        path: '~/.claude/skills/pr-review',
        scope: 'global',
        enabled: true,
        metadata: {
          name: 'PR Review',
          description: 'Pull Request 代码审查',
        },
      },
      {
        id: 'test-runner',
        path: '~/.claude/skills/test-runner',
        scope: 'global',
        enabled: false,
        metadata: {
          name: 'Test Runner',
          description: '测试运行专家',
        },
      },
    ];

    // Real implementation for Neutralino (commented out for browser development)
    // // @ts-ignore
    // const { filesystem } = await import('@neutralinojs/lib');
    // const skillsPath = this.expandPath('~/.claude/skills');
    // const skills: Skill[] = [];
    //
    // try {
    //   const exists = await filesystem.fileExists(skillsPath);
    //   if (!exists) return skills;
    //
    //   const entries = await filesystem.readDirectory(skillsPath);
    //
    //   for (const entry of entries) {
    //     if (entry.type === 'DIRECTORY') {
    //       const skillPath = `${skillsPath}/${entry.name}`;
    //       const skillMdPath = `${skillPath}/SKILL.md`;
    //
    //       let content: string | undefined;
    //       try {
    //         content = await filesystem.readFile(skillMdPath);
    //       } catch {
    //         // SKILL.md doesn't exist, skip
    //       }
    //
    //       skills.push({
    //         id: entry.name,
    //         path: skillPath,
    //         scope: 'global',
    //         enabled: true, // Default to enabled
    //         content,
    //       });
    //     }
    //   }
    // } catch (error) {
    //   console.error('Error scanning skills directory:', error);
    // }
    //
    // return skills;
  },
};

export default api;
