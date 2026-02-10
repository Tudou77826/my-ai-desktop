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
  // Project detection flags
  hasClaudeConfig?: boolean;
  hasClaudeMd?: boolean;
}

/**
 * Represents a configuration file
 */
export interface ConfigFile {
  path: string;
  type: 'settings' | 'mcp' | 'claude_md' | 'config';
  scope: 'global' | 'project';
  format: 'json' | 'markdown';
  content?: any;
  raw?: string;
  // For project-scoped configs
  projectName?: string;
  projectId?: string;
}

/**
 * Represents a coding rule for a specific language
 */
export interface Rule {
  id: string; // Language name (e.g., "typescript")
  name: string; // Display name
  language: string; // Language identifier
  path: string; // Full file path
  scope: 'global' | 'project';
  enabled: boolean;
  content: string; // Markdown content
  lastModified?: Date;
}

/**
 * Represents a ClaudeCode command (slash command)
 */
export interface Command {
  id: string; // Command name (e.g., "test", "clear")
  name: string; // Display name
  path: string; // Full file path (for custom commands)
  scope: 'global' | 'project' | 'builtin';
  enabled: boolean;
  builtin?: boolean; // true for built-in commands
  content?: string; // Markdown content (for custom commands)
  description?: string; // Short description
  lastModified?: Date;
}

/**
 * Application data structure
 */
export interface AppData {
  skills: Skill[];
  mcpServers: MCPServer[];
  projects: Project[];
  configFiles: ConfigFile[];
  rules?: Rule[]; // Optional rules array
  commands?: Command[]; // Optional commands array
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
