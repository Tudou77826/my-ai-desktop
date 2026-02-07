// ==================== Configuration Validator ====================
// Enhanced validation for ClaudeCode configuration files

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate JSON syntax
 */
export function validateJsonSyntax(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    JSON.parse(content);
  } catch (error) {
    if (error instanceof SyntaxError) {
      errors.push(`JSON syntax error: ${error.message}`);
    } else {
      errors.push(`Invalid JSON: ${(error as Error).message}`);
    }
    return { valid: false, errors, warnings };
  }

  return { valid: true, errors, warnings };
}

/**
 * Validate ClaudeCode settings.json structure
 */
export function validateSettingsJson(content: string): ValidationResult {
  const syntaxResult = validateJsonSyntax(content);
  if (!syntaxResult.valid) {
    return syntaxResult;
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const config = JSON.parse(content);

  // Check for required fields
  if (typeof config !== 'object' || config === null) {
    errors.push('Config must be an object');
    return { valid: false, errors, warnings };
  }

  // Validate disabledSkills (if present)
  if (config.disabledSkills !== undefined) {
    if (!Array.isArray(config.disabledSkills)) {
      errors.push('disabledSkills must be an array');
    } else {
      // Check if all items are strings
      const nonStringItems = config.disabledSkills.filter(
        (item: any) => typeof item !== 'string'
      );
      if (nonStringItems.length > 0) {
        errors.push('disabledSkills must contain only strings');
      }
    }
  }

  // Warn about unknown fields
  const knownFields = ['disabledSkills', 'mcpServers', 'skills', 'customInstructions'];
  const unknownFields = Object.keys(config).filter(
    key => !knownFields.includes(key)
  );
  if (unknownFields.length > 0) {
    warnings.push(`Unknown fields: ${unknownFields.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate MCP server configuration
 */
export function validateMcpServerConfig(server: any, serverId: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!server) {
    errors.push(`Server ${serverId} is missing`);
    return { valid: false, errors, warnings };
  }

  // Check transport method
  const hasCommand = server.command && typeof server.command === 'string';
  const hasUrl = server.url && typeof server.url === 'string';

  if (!hasCommand && !hasUrl) {
    errors.push(`Server ${serverId} must have either 'command' or 'url'`);
  }

  // Validate stdio transport
  if (hasCommand) {
    if (server.args && !Array.isArray(server.args)) {
      errors.push(`Server ${serverId}: args must be an array`);
    }
    if (server.env && typeof server.env !== 'object') {
      errors.push(`Server ${serverId}: env must be an object`);
    }
  }

  // Validate http transport
  if (hasUrl && !server.url.startsWith('http')) {
    warnings.push(`Server ${serverId}: URL should start with http:// or https://`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate .mcp.json structure
 */
export function validateMcpJson(content: string): ValidationResult {
  const syntaxResult = validateJsonSyntax(content);
  if (!syntaxResult.valid) {
    return syntaxResult;
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const config = JSON.parse(content);

  if (typeof config !== 'object' || config === null) {
    errors.push('Config must be an object');
    return { valid: false, errors, warnings };
  }

  if (!config.mcpServers) {
    // No MCP servers configured
    warnings.push('No MCP servers configured');
    return { valid: true, errors, warnings };
  }

  // Handle both array and object formats
  if (Array.isArray(config.mcpServers)) {
    // Array format
    config.mcpServers.forEach((server: any, index: number) => {
      const serverId = server.id || `index ${index}`;
      const result = validateMcpServerConfig(server, serverId);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    });
  } else if (typeof config.mcpServers === 'object') {
    // Object format (key-value)
    Object.entries(config.mcpServers).forEach(([serverId, server]) => {
      const result = validateMcpServerConfig(server, serverId);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    });
  } else {
    errors.push('mcpServers must be an object or array');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate CLAUDE.md content
 */
export function validateClaudeMd(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!content || content.trim().length === 0) {
    errors.push('CLAUDE.md content is empty');
    return { valid: false, errors, warnings };
  }

  // Warn if content is too short
  if (content.trim().length < 50) {
    warnings.push('CLAUDE.md content seems very short');
  }

  // Check for common sections
  const hasProjectOverview = /(?:#|##) .*?(?:项目概述|Project Overview|Overview)/i.test(content);
  const hasInstructions = /(?:#|##) .*?(?:指令|Instructions|Guidelines)/i.test(content);

  if (!hasProjectOverview && !hasInstructions) {
    warnings.push('Consider adding a project overview or instructions section');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Generic validation dispatcher
 */
export function validateConfig(configType: string, content: string): ValidationResult {
  switch (configType) {
    case 'settings':
      return validateSettingsJson(content);
    case 'mcp':
      return validateMcpJson(content);
    case 'claude_md':
      return validateClaudeMd(content);
    case 'json':
      return validateJsonSyntax(content);
    default:
      return validateJsonSyntax(content);
  }
}
