// ==================== Skill Manager Handler ====================
// Handles skill creation, validation, and testing

import * as yaml from 'js-yaml';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface SkillTemplate {
  id: string;
  name: string;
  description: string;
  category: 'productivity' | 'development' | 'automation' | 'custom';
  frontmatter: {
    name: string;
    description?: string;
    author?: string;
    disableModelInvocation?: boolean;
    userInvocable?: boolean;
    allowedTools?: string[];
    model?: string;
    context?: string;
    agent?: string;
    hooks?: string[];
  };
  content: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface SkillTestResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
}

/**
 * Parse skill frontmatter from SKILL.md content
 */
export function parseSkillFrontmatter(content: string): any {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return null;
  }

  try {
    return yaml.load(match[1]);
  } catch (error) {
    throw new Error(`Invalid YAML frontmatter: ${(error as Error).message}`);
  }
}

/**
 * Validate skill frontmatter
 */
export function validateSkillFrontmatter(frontmatter: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!frontmatter || typeof frontmatter !== 'object') {
    return {
      valid: false,
      errors: ['Frontmatter is missing or invalid']
    };
  }

  if (!frontmatter.name) {
    errors.push('name field is required');
  }

  // Optional fields validation
  if (frontmatter.allowedTools && !Array.isArray(frontmatter.allowedTools)) {
    errors.push('allowedTools must be an array');
  }

  if (frontmatter.hooks && !Array.isArray(frontmatter.hooks)) {
    errors.push('hooks must be an array');
  }

  if (frontmatter.disableModelInvocation && typeof frontmatter.disableModelInvocation !== 'boolean') {
    errors.push('disableModelInvocation must be a boolean');
  }

  if (frontmatter.userInvocable && typeof frontmatter.userInvocable !== 'boolean') {
    errors.push('userInvocable must be a boolean');
  }

  // Warnings
  if (!frontmatter.description) {
    warnings.push('description field is recommended');
  }

  if (!frontmatter.author) {
    warnings.push('author field is recommended');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Create a new skill
 */
export async function createSkill(
  scope: 'global' | 'project',
  projectPath: string | undefined,
  skill: {
    id: string;
    name: string;
    description?: string;
    author?: string;
    frontmatter: any;
    content: string
  }
): Promise<void> {
  // Determine skill directory path
  let skillDir: string;

  if (scope === 'global') {
    const skillsPath = path.join(os.homedir(), '.claude', 'skills');
    skillDir = path.join(skillsPath, skill.id);
  } else if (scope === 'project' && projectPath) {
    skillDir = path.join(projectPath, '.claude', 'skills', skill.id);
  } else {
    throw new Error('Invalid scope or missing project path');
  }

  // Create skill directory
  await fs.mkdir(skillDir, { recursive: true });

  // Generate SKILL.md content
  const frontmatterYaml = yaml.dump(skill.frontmatter);
  const skillContent = `---\n${frontmatterYaml}---\n\n${skill.content}`;

  // Write SKILL.md
  const skillMdPath = path.join(skillDir, 'SKILL.md');
  await fs.writeFile(skillMdPath, skillContent, 'utf-8');
}

/**
 * Test a skill (mock implementation)
 */
export async function testSkill(skillId: string, arguments_: string[]): Promise<SkillTestResult> {
  const startTime = Date.now();

  try {
    // Mock skill execution
    // In real scenario, this would invoke the actual skill logic

    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true,
      output: `Skill ${skillId} executed successfully with args: ${arguments_.join(', ')}`,
      executionTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      executionTime: Date.now() - startTime
    };
  }
}

/**
 * Get built-in skill templates
 */
export function getSkillTemplates(): SkillTemplate[] {
  return [
    {
      id: 'simple-command',
      name: 'Simple Command',
      description: 'A basic skill that executes a simple command',
      category: 'productivity',
      frontmatter: {
        name: 'Simple Command',
        description: 'A basic skill template',
        userInvocable: true,
        allowedTools: []
      },
      content: `# Simple Command Skill

This is a simple skill template.

## Usage

\`\`\`
/simple-command [argument]
\`\`\`

## Examples

- \`/simple-command hello\` - Says hello
- \`/simple-command test\` - Runs a test
`
    },
    {
      id: 'code-generator',
      name: 'Code Generator',
      description: 'Generate boilerplate code for various languages',
      category: 'development',
      frontmatter: {
        name: 'Code Generator',
        description: 'Generate boilerplate code',
        userInvocable: true,
        allowedTools: ['write_file', 'create_directory']
      },
      content: `# Code Generator

Generate boilerplate code for your projects.

## Supported Languages

- JavaScript/TypeScript
- Python
- Go
- Rust

## Usage

\`\`\`
/code-generator <language> <component-name>
\`\`\`
`
    },
    {
      id: 'git-helper',
      name: 'Git Helper',
      description: 'Common Git operations automation',
      category: 'development',
      frontmatter: {
        name: 'Git Helper',
        description: 'Automate common Git operations',
        userInvocable: true,
        allowedTools: []
      },
      content: `# Git Helper

Automate common Git operations.

## Features

- Create branch with naming convention
- Commit with formatted message
- Create pull request

## Usage

\`\`\`
/git-helper create-branch <type> <name>
/git-helper commit <type> <message>
\`\`\`
`
    },
    {
      id: 'file-organizer',
      name: 'File Organizer',
      description: 'Organize files into directories by type',
      category: 'automation',
      frontmatter: {
        name: 'File Organizer',
        description: 'Organize files automatically',
        userInvocable: true,
        allowedTools: ['read_file', 'write_file', 'create_directory', 'list_directory']
      },
      content: `# File Organizer

Automatically organize files into directories by type.

## Features

- Move images to /images folder
- Move documents to /documents folder
- Move code files to /src folder

## Usage

\`\`\`
/file-organize <directory>
\`\`\`
`
    },
    {
      id: 'custom-skill',
      name: 'Custom Skill',
      description: 'Start from scratch with a blank template',
      category: 'custom',
      frontmatter: {
        name: 'Custom Skill',
        description: 'A custom skill',
        userInvocable: true,
        allowedTools: []
      },
      content: `# Custom Skill

Describe what your skill does here.

## Usage

\`\`\`
/custom-skill [arguments]
\`\`\`
`
    }
  ];
}

/**
 * Get skill template by ID
 */
export function getSkillTemplate(templateId: string): SkillTemplate | undefined {
  return getSkillTemplates().find(t => t.id === templateId);
}
