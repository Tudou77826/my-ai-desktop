// ==================== Frontend API Wrapper ====================
// This file communicates with the Node.js backend server

import type { AppData, ConfigFile, HealthStatus, ValidationResult, Rule, Command } from '../types';

const API_BASE = 'http://localhost:3001/api';

// ==================== New Types for Iteration 3 ====================
export interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: object;
  permissionStatus: 'allowed' | 'blocked' | 'default';
}

export interface MCPResource {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
}

export interface HealthCheckPoint {
  timestamp: Date;
  status: 'ok' | 'error' | 'unknown';
  latency?: number;
}

export interface SkillTemplate {
  id: string;
  name: string;
  description: string;
  category: 'productivity' | 'development' | 'automation' | 'custom';
  frontmatter: any;
  content: string;
}

export interface SkillTestResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
}

export interface EnvVarResult {
  expanded: string;
  references: string[];
  original: string;
}

export interface WishlistItem {
  id: string;
  title: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  completed: boolean;
}

export interface WishlistData {
  mcp: WishlistItem[];
  skills: WishlistItem[];
  subagents: WishlistItem[];
}

export interface SubAgent {
  id: string;
  name: string;
  description: string;
  scope: 'user' | 'project' | 'builtin';
  tools?: string[];
  disallowedTools?: string[];
  model?: 'sonnet' | 'opus' | 'haiku' | 'inherit';
  permissionMode?: 'default' | 'acceptEdits' | 'delegate' | 'dontAsk' | 'bypassPermissions' | 'plan';
  maxTurns?: number;
  skills?: string[];
  mcpServers?: string[] | Record<string, any>;
  hooks?: Record<string, any>;
  memory?: 'user' | 'project' | 'local';
  content?: string;
  filePath?: string;
}

/**
 * Helper function for API calls
 */
async function apiCall(endpoint: string, options?: RequestInit) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
}

/**
 * API functions exposed to frontend
 */
export const api = {
  // ==================== Data Loading ====================

  /**
   * Load all ClaudeCode configuration data
   */
  async loadAllData(): Promise<AppData> {
    return apiCall('/data/all');
  },

  /**
   * Refresh all data (reload from disk)
   */
  async refreshData(): Promise<AppData> {
    return apiCall('/data/all');
  },

  // ==================== File Operations ====================

  /**
   * Read a configuration file
   */
  async readConfig(path: string): Promise<ConfigFile> {
    return apiCall(`/config/read?path=${encodeURIComponent(path)}`);
  },

  /**
   * Write a configuration file with optional backup
   */
  async writeConfig(path: string, content: string, backup: boolean = true): Promise<void> {
    return apiCall('/config/write', {
      method: 'POST',
      body: JSON.stringify({ path, content, backup }),
    });
  },

  // ==================== Validation & Preview ====================

  /**
   * Validate configuration
   */
  async validateConfig(configType: string, content: string): Promise<ValidationResult> {
    return apiCall('/config/validate', {
      method: 'POST',
      body: JSON.stringify({ configType, content }),
    });
  },

  /**
   * Generate diff preview for changes
   */
  async previewChanges(path: string, newContent: string): Promise<string> {
    try {
      const oldConfig = await this.readConfig(path);
      const oldContent = oldConfig.raw || '';

      // Simple diff generation
      const oldLines = oldContent.split('\n');
      const newLines = newContent.split('\n');
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
    return apiCall('/skill/toggle', {
      method: 'POST',
      body: JSON.stringify({ skillId, enabled }),
    });
  },

  /**
   * Toggle MCP server enabled/disabled
   */
  async toggleMcpServer(serverId: string, enabled: boolean): Promise<void> {
    return apiCall('/mcp/toggle', {
      method: 'POST',
      body: JSON.stringify({ serverId, enabled }),
    });
  },

  // ==================== MCP Testing ====================

  /**
   * Test MCP server connection
   */
  async testMcpConnection(server: any): Promise<HealthStatus> {
    return apiCall('/mcp/test', {
      method: 'POST',
      body: JSON.stringify({ transport: server.transport, url: server.config?.url }),
    });
  },

  // ==================== Projects ====================

  /**
   * Scan directories for ClaudeCode projects
   */
  async scanProjects(searchPath?: string): Promise<any[]> {
    const params = searchPath ? `?searchPath=${encodeURIComponent(searchPath)}` : '';
    return apiCall(`/projects/scan${params}`);
  },

  /**
   * Get project details
   */
  async getProjectDetail(projectPath: string): Promise<any> {
    return apiCall(`/project/detail?path=${encodeURIComponent(projectPath)}`);
  },

  /**
   * Manually add a project path
   */
  async addProject(projectPath: string): Promise<any> {
    return apiCall('/project/add', {
      method: 'POST',
      body: JSON.stringify({ projectPath }),
    });
  },

  /**
   * Remove a project from the list (does not delete files)
   */
  async removeProject(projectPath: string): Promise<any> {
    return apiCall('/projects/remove', {
      method: 'POST',
      body: JSON.stringify({ projectPath }),
    });
  },

  // ==================== MCP Tools & Resources (Iteration 3) ====================

  /**
   * Get MCP tools for a server
   */
  async getMcpTools(serverId: string): Promise<MCPTool[]> {
    return apiCall(`/mcp/tools/${encodeURIComponent(serverId)}`);
  },

  /**
   * Get MCP resources for a server
   */
  async getMcpResources(serverId: string): Promise<MCPResource[]> {
    return apiCall(`/mcp/resources/${encodeURIComponent(serverId)}`);
  },

  /**
   * Test an MCP tool
   */
  async testMcpTool(serverId: string, toolName: string, args: any): Promise<any> {
    return apiCall(`/mcp/test-tool/${encodeURIComponent(serverId)}`, {
      method: 'POST',
      body: JSON.stringify({ toolName, args }),
    });
  },

  /**
   * Get MCP health check history
   */
  async getMcpHealthHistory(serverId: string): Promise<HealthCheckPoint[]> {
    return apiCall(`/mcp/health-history/${encodeURIComponent(serverId)}`);
  },

  // ==================== Skill Management (Iteration 3) ====================

  /**
   * Get skill templates
   */
  async getSkillTemplates(): Promise<SkillTemplate[]> {
    return apiCall('/skills/templates');
  },

  /**
   * Create a new skill
   */
  async createSkill(
    scope: 'global' | 'project',
    skill: any,
    projectPath?: string
  ): Promise<{ success: boolean; path: string }> {
    return apiCall('/skills/create', {
      method: 'POST',
      body: JSON.stringify({ scope, projectPath, skill }),
    });
  },

  /**
   * Validate skill frontmatter
   */
  async validateSkillFrontmatter(frontmatter: any): Promise<ValidationResult> {
    return apiCall('/skills/validate-frontmatter', {
      method: 'POST',
      body: JSON.stringify({ frontmatter }),
    });
  },

  /**
   * Parse skill frontmatter from SKILL.md content
   */
  async parseSkillFrontmatter(content: string): Promise<{ frontmatter: any }> {
    return apiCall('/skills/parse-frontmatter', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  /**
   * Test a skill
   */
  async testSkill(skillId: string, arguments_?: string[]): Promise<SkillTestResult> {
    return apiCall(`/skills/test/${encodeURIComponent(skillId)}`, {
      method: 'POST',
      body: JSON.stringify({ arguments: arguments_ }),
    });
  },

  // ==================== Environment Variables (Iteration 3) ====================

  /**
   * Expand environment variables
   */
  async expandEnvVars(value: string): Promise<EnvVarResult> {
    return apiCall('/env/expand', {
      method: 'POST',
      body: JSON.stringify({ value }),
    });
  },

  // ==================== Wishlist ====================

  /**
   * Get all wishlist data
   */
  async getWishlist(): Promise<WishlistData> {
    return apiCall('/wishlist');
  },

  /**
   * Add a wishlist item
   */
  async addWishlistItem(type: 'mcp' | 'skills' | 'subagents', title: string, notes: string): Promise<{ success: boolean; item: WishlistItem }> {
    return apiCall('/wishlist/add', {
      method: 'POST',
      body: JSON.stringify({ type, title, notes }),
    });
  },

  /**
   * Update a wishlist item
   */
  async updateWishlistItem(type: 'mcp' | 'skills' | 'subagents', itemId: string, updates: Partial<Pick<WishlistItem, 'title' | 'notes' | 'completed'>>): Promise<{ success: boolean; item: WishlistItem }> {
    return apiCall('/wishlist/update', {
      method: 'PUT',
      body: JSON.stringify({ type, itemId, ...updates }),
    });
  },

  /**
   * Remove a wishlist item
   */
  async removeWishlistItem(type: 'mcp' | 'skills' | 'subagents', itemId: string): Promise<{ success: boolean }> {
    return apiCall('/wishlist/remove', {
      method: 'DELETE',
      body: JSON.stringify({ type, itemId }),
    });
  },

  // ==================== SubAgents ====================

  /**
   * Get all subagents
   */
  async getSubAgents(projectPath?: string): Promise<{ subagents: SubAgent[] }> {
    const query = projectPath ? `?projectPath=${encodeURIComponent(projectPath)}` : '';
    return apiCall(`/subagents${query}`);
  },

  /**
   * Create or update a subagent
   */
  async saveSubAgent(subagent: Partial<SubAgent> & { name: string; description: string; scope: 'user' | 'project' }, projectPath?: string) {
    return apiCall('/subagents/save', {
      method: 'POST',
      body: JSON.stringify({ ...subagent, projectPath }),
    });
  },

  /**
   * Delete a subagent
   */
  async deleteSubAgent(id: string, scope: 'user' | 'project', projectPath?: string) {
    return apiCall(`/subagents/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ scope, projectPath }),
    });
  },

  /**
   * Get subagent file content
   */
  async getSubAgentContent(id: string, scope: 'user' | 'project', projectPath?: string): Promise<{ content: string }> {
    const query = `?scope=${scope}${projectPath ? `&projectPath=${encodeURIComponent(projectPath)}` : ''}`;
    return apiCall(`/subagents/${id}/content${query}`);
  },

  // ==================== Rules ====================

  /**
   * Get all rules
   */
  async getAllRules(): Promise<Rule[]> {
    return apiCall('/rules/all');
  },

  /**
   * Create a new rule
   */
  async createRule(language: string, content: string): Promise<Rule> {
    return apiCall('/rules/create', {
      method: 'POST',
      body: JSON.stringify({ language, content }),
    });
  },

  /**
   * Update a rule
   */
  async updateRule(language: string, content: string): Promise<Rule> {
    return apiCall('/rules/update', {
      method: 'POST',
      body: JSON.stringify({ language, content }),
    });
  },

  /**
   * Delete a rule
   */
  async deleteRule(language: string): Promise<{ success: boolean; message: string }> {
    return apiCall('/rules/delete', {
      method: 'DELETE',
      body: JSON.stringify({ language }),
    });
  },

  // ==================== Commands ====================

  /**
   * Get all commands (both built-in and custom)
   * Uses /data/all endpoint to include plugin commands
   */
  async getAllCommands(): Promise<Command[]> {
    const data = await apiCall('/data/all');
    return data.commands || [];
  },

  /**
   * Create a new command
   */
  async createCommand(commandId: string, content: string): Promise<Command> {
    return apiCall('/commands/create', {
      method: 'POST',
      body: JSON.stringify({ commandId, content }),
    });
  },

  /**
   * Update a command
   */
  async updateCommand(commandId: string, content: string): Promise<Command> {
    return apiCall('/commands/update', {
      method: 'POST',
      body: JSON.stringify({ commandId, content }),
    });
  },

  /**
   * Delete a command
   */
  async deleteCommand(commandId: string): Promise<{ success: boolean; message: string }> {
    return apiCall('/commands/delete', {
      method: 'DELETE',
      body: JSON.stringify({ commandId }),
    });
  },
};

export default api;
