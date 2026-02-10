// ==================== SubAgent Manager ====================
// Parse and manage Claude Code subagent configurations

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as yaml from 'js-yaml';

export interface SubAgentConfig {
  name: string;
  description: string;
  tools?: string[];
  disallowedTools?: string[];
  model?: 'sonnet' | 'opus' | 'haiku' | 'inherit';
  permissionMode?: 'default' | 'acceptEdits' | 'delegate' | 'dontAsk' | 'bypassPermissions' | 'plan';
  maxTurns?: number;
  skills?: string[];
  mcpServers?: string[] | Record<string, any>;
  hooks?: Record<string, any>;
  memory?: 'user' | 'project' | 'local';
}

export interface SubAgent extends SubAgentConfig {
  id: string;
  scope: 'user' | 'project' | 'builtin';
  content: string;
  filePath?: string;
}

const USER_AGENTS_DIR = path.join(os.homedir(), '.claude', 'agents');

// Built-in agents from Claude Code
const BUILTIN_AGENTS: SubAgent[] = [
  {
    id: 'Explore',
    name: 'Explore',
    description: 'A fast, read-only agent optimized for searching and analyzing codebases',
    model: 'haiku',
    scope: 'builtin',
    tools: ['Read', 'Grep', 'Glob'],
    content: 'Use for file discovery, code search, and codebase exploration. Keeps exploration results out of the main conversation context.',
  },
  {
    id: 'Plan',
    name: 'Plan',
    description: 'A research agent used during plan mode to gather context before presenting a plan',
    model: 'inherit',
    scope: 'builtin',
    tools: ['Read', 'Grep', 'Glob'],
    content: 'Researches codebase during planning. Cannot spawn other subagents. Uses read-only tools.',
  },
  {
    id: 'general-purpose',
    name: 'general-purpose',
    description: 'A capable agent for complex, multi-step tasks requiring both exploration and action',
    model: 'inherit',
    scope: 'builtin',
    tools: [],
    content: 'Use for complex research, multi-step operations, and code modifications. Has access to all tools.',
  },
  {
    id: 'Bash',
    name: 'Bash',
    description: 'An agent for running terminal commands in a separate context',
    model: 'inherit',
    scope: 'builtin',
    tools: ['Bash'],
    content: 'Runs terminal commands in a separate context.',
  },
  {
    id: 'statusline-setup',
    name: 'statusline-setup',
    description: 'An agent used when running /statusline to configure your status line',
    model: 'sonnet',
    scope: 'builtin',
    content: 'Configures status line when you run the /statusline command.',
  },
  {
    id: 'claude-code-guide',
    name: 'claude-code-guide',
    description: 'An agent that answers questions about Claude Code features',
    model: 'haiku',
    scope: 'builtin',
    content: 'Use when asking questions about Claude Code features, hooks, slash commands, or usage.',
  },
];

/**
 * Parse YAML frontmatter from a markdown file
 */
export function parseFrontmatter(content: string): { frontmatter: any; body: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, body: content };
  }

  try {
    const frontmatter = yaml.load(match[1]) as any;
    const body = match[2];
    return { frontmatter, body };
  } catch (error) {
    throw new Error(`Failed to parse YAML frontmatter: ${(error as Error).message}`);
  }
}

/**
 * Build YAML frontmatter from config object
 */
export function buildFrontmatter(config: SubAgentConfig): string {
  const { name, description, ...rest } = config;

  const frontmatter: any = {
    name,
    description,
  };

  // Add optional fields if they exist
  if (rest.tools && Array.isArray(rest.tools) && rest.tools.length > 0) {
    frontmatter.tools = rest.tools;
  }
  if (rest.disallowedTools && Array.isArray(rest.disallowedTools) && rest.disallowedTools.length > 0) {
    frontmatter.disallowedTools = rest.disallowedTools;
  }
  if (rest.model) {
    frontmatter.model = rest.model;
  }
  if (rest.permissionMode) {
    frontmatter.permissionMode = rest.permissionMode;
  }
  if (rest.maxTurns) {
    frontmatter.maxTurns = rest.maxTurns;
  }
  if (rest.skills && rest.skills.length > 0) {
    frontmatter.skills = rest.skills;
  }
  if (rest.mcpServers) {
    frontmatter.mcpServers = rest.mcpServers;
  }
  if (rest.hooks) {
    frontmatter.hooks = rest.hooks;
  }
  if (rest.memory) {
    frontmatter.memory = rest.memory;
  }

  const yamlStr = yaml.dump(frontmatter, {
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
  });

  return yamlStr.trim();
}

/**
 * Load all subagents from a directory
 */
export async function loadSubAgentsFromDir(agentsDir: string, scope: 'user' | 'project'): Promise<SubAgent[]> {
  try {
    await fs.access(agentsDir);
  } catch {
    // Directory doesn't exist, return empty array
    return [];
  }

  const entries = await fs.readdir(agentsDir, { withFileTypes: true });
  const subagents: SubAgent[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) {
      continue;
    }

    const filePath = path.join(agentsDir, entry.name);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const { frontmatter, body } = parseFrontmatter(content);

      if (!frontmatter.name) {
        console.warn(`[WARN] Subagent ${entry.name} missing name field`);
        continue;
      }

      subagents.push({
        ...frontmatter,
        id: frontmatter.name,
        scope,
        content: body,
        filePath,
      } as SubAgent);
    } catch (error) {
      console.error(`[ERROR] Failed to load subagent ${entry.name}: ${(error as Error).message}`);
    }
  }

  return subagents;
}

/**
 * Load all subagents (builtin, user and project scope)
 */
export async function loadAllSubAgents(projectPath?: string): Promise<SubAgent[]> {
  const subagents: SubAgent[] = [];

  // Add built-in agents first
  subagents.push(...BUILTIN_AGENTS);

  // Load user-level subagents
  const userSubagents = await loadSubAgentsFromDir(USER_AGENTS_DIR, 'user');
  subagents.push(...userSubagents);

  // Load project-level subagents if project path provided
  if (projectPath) {
    const projectAgentsDir = path.join(projectPath, '.claude', 'agents');
    const projectSubagents = await loadSubAgentsFromDir(projectAgentsDir, 'project');
    subagents.push(...projectSubagents);
  }

  // Remove duplicates (project scope overrides user scope, builtin always shown)
  const uniqueSubagents = new Map<string, SubAgent>();
  for (const subagent of subagents) {
    // Custom agents override builtin agents with same name
    uniqueSubagents.set(subagent.id, subagent);
  }

  return Array.from(uniqueSubagents.values());
}

/**
 * Save a subagent to file
 */
export async function saveSubAgent(
  subagent: Partial<SubAgent>,
  scope: 'user' | 'project',
  projectPath?: string
): Promise<SubAgent> {
  const agentsDir = scope === 'user' ? USER_AGENTS_DIR : path.join(projectPath!, '.claude', 'agents');

  // Ensure directory exists
  await fs.mkdir(agentsDir, { recursive: true });

  // Build filename from name
  const fileName = `${subagent.name}.md`;
  const filePath = path.join(agentsDir, fileName);

  // Build frontmatter and content
  const config: SubAgentConfig = {
    name: subagent.name!,
    description: subagent.description!,
    tools: subagent.tools || [],
    disallowedTools: subagent.disallowedTools || [],
    model: subagent.model,
    permissionMode: subagent.permissionMode,
    maxTurns: subagent.maxTurns,
    skills: subagent.skills || [],
    mcpServers: subagent.mcpServers,
    hooks: subagent.hooks,
    memory: subagent.memory,
  };

  const frontmatterYaml = buildFrontmatter(config);
  const content = `---\n${frontmatterYaml}\n---\n\n${subagent.content || ''}`;

  // Write to file
  await fs.writeFile(filePath, content, 'utf-8');

  return {
    ...config,
    id: config.name,
    scope,
    content: subagent.content || '',
    filePath,
  };
}

/**
 * Delete a subagent file
 */
export async function deleteSubAgent(subagentId: string, scope: 'user' | 'project', projectPath?: string): Promise<void> {
  const agentsDir = scope === 'user' ? USER_AGENTS_DIR : path.join(projectPath!, '.claude', 'agents');
  const filePath = path.join(agentsDir, `${subagentId}.md`);

  try {
    await fs.unlink(filePath);
  } catch (error) {
    throw new Error(`Failed to delete subagent: ${(error as Error).message}`);
  }
}

/**
 * Validate subagent configuration
 */
export function validateSubAgentConfig(config: Partial<SubAgentConfig>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.name) {
    errors.push('name is required');
  } else if (!/^[a-z0-9-]+$/.test(config.name)) {
    errors.push('name must contain only lowercase letters, numbers, and hyphens');
  }

  if (!config.description) {
    errors.push('description is required');
  }

  if (config.model && !['sonnet', 'opus', 'haiku', 'inherit'].includes(config.model)) {
    errors.push('model must be one of: sonnet, opus, haiku, inherit');
  }

  if (config.permissionMode && !['default', 'acceptEdits', 'delegate', 'dontAsk', 'bypassPermissions', 'plan'].includes(config.permissionMode)) {
    errors.push('permissionMode must be one of: default, acceptEdits, delegate, dontAsk, bypassPermissions, plan');
  }

  if (config.memory && !['user', 'project', 'local'].includes(config.memory)) {
    errors.push('memory must be one of: user, project, local');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
