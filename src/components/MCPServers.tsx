// ==================== MCPServers Component ====================

import { useState } from 'react';
import { Zap, RefreshCw } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useToast } from './ui/Toast';
import { Button } from './ui/Button';
import { MCPServerCard } from './MCPServerCard';
import { MCPToolBrowser } from './mcp/MCPToolBrowser';

export function MCPServers() {
  const { data, testMcpConnection } = useAppStore();
  const { showToast } = useToast();
  const [testingServerId, setTestingServerId] = useState<string | null>(null);
  const [selectedServerForTools, setSelectedServerForTools] = useState<{ id: string; name: string } | null>(null);

  const handleToggle = async (serverId: string, enabled: boolean) => {
    try {
      // Call API to toggle
      const response = await fetch('http://localhost:3001/api/mcp/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId, enabled }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle server');
      }

      // Reload data to get updated state
      const { loadData } = useAppStore.getState();
      await loadData();

      showToast(`MCP server ${serverId} ${enabled ? 'enabled' : 'disabled'}`, 'success');
    } catch (error) {
      showToast(`Failed to toggle server: ${(error as Error).message}`, 'error');
    }
  };

  const handleTest = async (serverId: string) => {
    setTestingServerId(serverId);
    try {
      await testMcpConnection(serverId);
      showToast('Connection test completed', 'success');
    } catch (error) {
      showToast(`Connection test failed: ${(error as Error).message}`, 'error');
    } finally {
      setTestingServerId(null);
    }
  };

  const handleRefresh = async () => {
    const { loadData } = useAppStore.getState();
    try {
      await loadData();
      showToast('MCP servers refreshed', 'success');
    } catch (error) {
      showToast(`Failed to refresh: ${(error as Error).message}`, 'error');
    }
  };

  const servers = data?.mcpServers || [];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">MCP Servers</h1>
        <p className="text-gray-600">Manage your Model Context Protocol servers</p>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-end mb-6">
        <Button
          variant="outline"
          onClick={handleRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Servers Grid */}
      {servers.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Zap className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500">No MCP servers configured</p>
          <p className="text-sm text-gray-400 mt-2">
            Add servers to your ~/.mcp.json configuration file
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {servers.map((server) => (
            <MCPServerCard
              key={server.id}
              server={server}
              onToggle={handleToggle}
              onTest={handleTest}
              onBrowseTools={(serverId) => setSelectedServerForTools({ id: serverId, name: server.id })}
              testing={testingServerId === server.id}
            />
          ))}
        </div>
      )}

      {/* Tool Browser Dialog */}
      {selectedServerForTools && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <MCPToolBrowser
              serverId={selectedServerForTools.id}
              serverName={selectedServerForTools.name}
            />
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <Button onClick={() => setSelectedServerForTools(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
