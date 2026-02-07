// ==================== Core Type Definitions ====================

/**
 * Represents a ClaudeCode skill
 */
export interface Skill {
  id: string; // Directory name
  path: string; // Full path
  scope: 'global' | 'project';
  enabled: boolean;
  metadata?: {
    name?: string;
    description?: string;
    author?: string;
  };
  content?: string; // SKILL.md content (lazy loaded)
}

/**
 * Represents an MCP (Model Context Protocol) server
 */
export interface MCPServer {
  id: string; // Server name
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

/**
 * Represents a project with ClaudeCode configuration
 */
export interface Project {
  id: string; // Project path as ID
  name: string; // Directory name
  path: string; // Full path
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

/**
 * Represents a configuration file
 */
export interface ConfigFile {
  path: string;
  type: 'settings' | 'mcp' | 'claude_md';
  scope: 'global' | 'project';
  format: 'json' | 'markdown';
  content?: any;
  raw?: string;
}

/**
 * Application data structure
 */
export interface AppData {
  skills: Skill[];
  mcpServers: MCPServer[];
  projects: Project[];
  configFiles: ConfigFile[];
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * Health status for MCP servers
 */
export interface HealthStatus {
  status: 'unknown' | 'ok' | 'error';
  latency?: number;
  lastCheck?: Date;
  error?: string;
}
