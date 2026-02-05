// ==================== Frontend API Wrapper ====================
// This file communicates with the Node.js backend server

import type { AppData, ConfigFile, HealthStatus, ValidationResult } from '../types';

const API_BASE = 'http://localhost:3001/api';

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
    // For now, this is a placeholder
    // In real implementation, would modify ~/.claude/settings.json
    console.log(`Toggle skill ${skillId}: ${enabled}`);
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
};

export default api;
