// ==================== MCP Tools Handler ====================
// Handles MCP tool and resource discovery using official MCP SDK

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

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

// Cache for MCP clients to avoid recreating them
const clientCache = new Map<string, { client: Client; transport: any }>();

/**
 * Get MCP tools for a server using real MCP protocol
 */
export async function getMcpTools(serverId: string, serverConfig: any): Promise<MCPTool[]> {
  try {
    const startTime = Date.now();
    const client = await getOrCreateClient(serverId, serverConfig);

    const { tools } = await client.listTools();
    const latency = Date.now() - startTime;

    // Record successful health check
    addHealthCheckPoint(serverId, 'ok', latency);

    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      permissionStatus: 'allowed' as const
    }));
  } catch (error) {
    // Record failed health check
    addHealthCheckPoint(serverId, 'error');

    console.error(`[MCP Tools] Error getting tools for ${serverId}:`, error);

    // Return empty array on error instead of throwing
    return [];
  }
}

/**
 * Get MCP resources for a server using real MCP protocol
 */
export async function getMcpResources(serverId: string, serverConfig: any): Promise<MCPResource[]> {
  try {
    const startTime = Date.now();
    const client = await getOrCreateClient(serverId, serverConfig);

    const { resources } = await client.listResources();
    const latency = Date.now() - startTime;

    // Record successful health check
    addHealthCheckPoint(serverId, 'ok', latency);

    return resources.map(resource => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description,
      mimeType: resource.mimeType
    }));
  } catch (error) {
    // Record failed health check
    addHealthCheckPoint(serverId, 'error');

    console.error(`[MCP Resources] Error getting resources for ${serverId}:`, error);

    // Return empty array on error
    return [];
  }
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
  try {
    const client = await getOrCreateClient(serverId, serverConfig);

    const result = await client.callTool({
      name: toolName,
      arguments: args
    });

    return {
      success: true,
      result: result
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message
    };
  }
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

/**
 * Get or create MCP client for a server
 */
async function getOrCreateClient(serverId: string, serverConfig: any): Promise<Client> {
  // Check cache first
  const cached = clientCache.get(serverId);
  if (cached) {
    return cached.client;
  }

  // Create new client
  const client = new Client(
    {
      name: 'claude-code-config-manager',
      version: '1.0.0'
    },
    {
      capabilities: {}
    }
  );

  let transport: any;

  if (serverConfig.transport === 'stdio' || serverConfig.command) {
    // Stdio transport
    const command = serverConfig.command || 'npx';
    const args = serverConfig.args || [];

    transport = new StdioClientTransport({
      command,
      args,
      env: {
        ...process.env,
        ...serverConfig.env
      }
    });
  } else if (serverConfig.transport === 'http' || serverConfig.url) {
    // HTTP/SSE transport
    const url = serverConfig.url;
    if (!url) {
      throw new Error('URL is required for HTTP transport');
    }

    transport = new SSEClientTransport(new URL(url));
  } else {
    throw new Error(`Unsupported transport: ${serverConfig.transport}`);
  }

  // Connect to the MCP server
  await client.connect(transport);

  // Cache the client
  clientCache.set(serverId, { client, transport });

  return client;
}

/**
 * Close and cleanup a client connection
 */
export async function closeClient(serverId: string): Promise<void> {
  const cached = clientCache.get(serverId);
  if (cached) {
    try {
      await cached.client.close();
    } catch (error) {
      console.error(`[MCP] Error closing client for ${serverId}:`, error);
    }
    clientCache.delete(serverId);
  }
}

/**
 * Close all client connections
 */
export async function closeAllClients(): Promise<void> {
  const promises = Array.from(clientCache.keys()).map(serverId => closeClient(serverId));
  await Promise.allSettled(promises);
  clientCache.clear();
}
