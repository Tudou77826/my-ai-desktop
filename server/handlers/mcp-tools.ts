// ==================== MCP Tools Handler ====================
// Handles MCP tool and resource discovery

import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

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

export interface MCPHealthHistory {
  serverId: string;
  history: Array<{
    timestamp: Date;
    status: 'ok' | 'error' | 'unknown';
    latency?: number;
  }>;
}

// In-memory storage for health history
const healthHistoryStore = new Map<string, MCPHealthHistory['history']>();

/**
 * Get MCP tools for a server
 */
export async function getMcpTools(serverId: string, serverConfig: any): Promise<MCPTool[]> {
  const { transport, command, args, url } = serverConfig;

  // For HTTP transport, we can't easily get tools without proper MCP client
  // Return mock data based on common MCP servers
  if (transport === 'http' && url) {
    return getMockHttpTools(serverId, url);
  }

  // For stdio transport, try to spawn the process and call tools/list
  if (transport === 'stdio' && command) {
    try {
      return await getStdioTools(command, args || []);
    } catch (error) {
      console.error(`Failed to get stdio tools for ${serverId}:`, error);
      return getMockTools(serverId);
    }
  }

  // Default to mock data
  return getMockTools(serverId);
}

/**
 * Get MCP resources for a server
 */
export async function getMcpResources(serverId: string, serverConfig: any): Promise<MCPResource[]> {
  // Similar to tools, return mock data
  return getMockResources(serverId);
}

/**
 * Test calling an MCP tool
 */
export async function testMcpTool(
  serverId: string,
  toolName: string,
  args: any,
  serverConfig: any
): Promise<any> {
  // Mock implementation - in real scenario would call actual MCP server
  return {
    success: true,
    result: `Mock result from ${toolName}`,
    arguments: args
  };
}

/**
 * Get health check history
 */
export function getHealthHistory(serverId: string): MCPHealthHistory['history'] {
  return healthHistoryStore.get(serverId) || [];
}

/**
 * Add health check point
 */
export function addHealthCheckPoint(
  serverId: string,
  status: 'ok' | 'error' | 'unknown',
  latency?: number
): void {
  const history = healthHistoryStore.get(serverId) || [];
  history.push({
    timestamp: new Date(),
    status,
    latency
  });

  // Keep only last 20 check points
  if (history.length > 20) {
    history.shift();
  }

  healthHistoryStore.set(serverId, history);
}

// ==================== Helper Functions ====================

/**
 * Get mock tools for stdio transport
 */
async function getStdioTools(command: string, args: string[]): Promise<MCPTool[]> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      env: process.env
    });

    let output = '';
    let errorOutput = '';

    proc.stdout?.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Timeout after 5 seconds
    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error('Timeout getting tools'));
    }, 5000);

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        try {
          const response = JSON.parse(output);
          // Extract tools from MCP response
          const tools = response.result?.tools || [];
          resolve(tools.map((t: any) => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
            permissionStatus: 'allowed' as const
          })));
        } catch {
          reject(new Error('Failed to parse MCP response'));
        }
      } else {
        reject(new Error(errorOutput || 'Process failed'));
      }
    });
  });
}

/**
 * Get mock tools for known MCP servers
 */
function getMockTools(serverId: string): MCPTool[] {
  const mockToolsMap: Record<string, MCPTool[]> = {
    'filesystem': [
      {
        name: 'read_file',
        description: 'Read the complete contents of a file',
        permissionStatus: 'allowed'
      },
      {
        name: 'write_file',
        description: 'Write content to a file',
        permissionStatus: 'allowed'
      },
      {
        name: 'list_directory',
        description: 'List files and directories in a path',
        permissionStatus: 'allowed'
      },
      {
        name: 'directory_tree',
        description: 'Get a recursive directory tree',
        permissionStatus: 'allowed'
      },
      {
        name: 'search_files',
        description: 'Search for files matching a pattern',
        permissionStatus: 'allowed'
      },
      {
        name: 'get_file_info',
        description: 'Get metadata about a file',
        permissionStatus: 'allowed'
      },
      {
        name: 'create_directory',
        description: 'Create a new directory',
        permissionStatus: 'allowed'
      },
      {
        name: 'delete_file',
        description: 'Delete a file or directory',
        permissionStatus: 'blocked'
      }
    ],
    'brave-search': [
      {
        name: 'brave_web_search',
        description: 'Search the web using Brave Search API',
        permissionStatus: 'allowed'
      },
      {
        name: 'brave_news_search',
        description: 'Search news articles',
        permissionStatus: 'default'
      }
    ],
    'github': [
      {
        name: 'create_issue',
        description: 'Create a GitHub issue',
        permissionStatus: 'allowed'
      },
      {
        name: 'create_pull_request',
        description: 'Create a pull request',
        permissionStatus: 'allowed'
      },
      {
        name: 'list_issues',
        description: 'List issues in a repository',
        permissionStatus: 'allowed'
      },
      {
        name: 'add_comment',
        description: 'Add a comment to an issue or PR',
        permissionStatus: 'blocked'
      }
    ]
  };

  // Try to match by server ID or return generic tools
  return mockToolsMap[serverId] || [
    {
      name: 'generic_tool_1',
      description: 'Generic MCP tool',
      permissionStatus: 'default'
    }
  ];
}

/**
 * Get mock HTTP tools
 */
function getMockHttpTools(serverId: string, url: string): MCPTool[] {
  // Check URL for clues about the server type
  if (url.includes('filesystem')) {
    return getMockTools('filesystem');
  }
  if (url.includes('github')) {
    return getMockTools('github');
  }

  return getMockTools(serverId);
}

/**
 * Get mock resources
 */
function getMockResources(serverId: string): MCPResource[] {
  const mockResourcesMap: Record<string, MCPResource[]> = {
    'filesystem': [
      {
        uri: 'file:///',
        name: 'Root Filesystem',
        description: 'Root filesystem access',
        mimeType: 'inode/directory'
      }
    ]
  };

  return mockResourcesMap[serverId] || [];
}
