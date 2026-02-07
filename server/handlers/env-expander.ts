// ==================== Environment Variable Expander ====================
// Expands environment variables in strings

/**
 * Expand environment variables in a string
 * Supports both ${VAR} and ${VAR:-default} syntax
 */
export function expandEnvVars(
  value: string,
  env: Record<string, string> = process.env
): string {
  if (!value) return value;

  return value.replace(
    /\$\{([^}:]+)(?::-([^}]*))?\}|\$([A-Z_][A-Z0-9_]*)/gi,
    (match, braced, bracedDefault, unbraced) => {
      const varName = braced || unbraced;
      const defaultValue = bracedDefault || '';
      return env[varName] || defaultValue;
    }
  );
}

/**
 * Expand all environment variables in an object recursively
 */
export function expandEnvVarsInObject(
  obj: any,
  env: Record<string, string> = process.env
): any {
  if (typeof obj === 'string') {
    return expandEnvVars(obj, env);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => expandEnvVarsInObject(item, env));
  }

  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = expandEnvVarsInObject(value, env);
    }
    return result;
  }

  return obj;
}

/**
 * List all environment variable references in a string
 */
export function findEnvVarReferences(value: string): string[] {
  const references: string[] = [];
  const regex = /\$\{([^}:]+)(?::-([^}]*))?\}|\$([A-Z_][A-Z0-9_]*)/gi;
  let match;

  while ((match = regex.exec(value)) !== null) {
    const varName = match[1] || match[3];
    if (varName && !references.includes(varName)) {
      references.push(varName);
    }
  }

  return references;
}
