// ==================== MCP Tool Browser Component ====================

import { useState, useEffect } from 'react';
import { Search, Wrench, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { api } from '../../lib/api';
import type { MCPTool } from '../../lib/api';
import { useTranslation } from 'react-i18next';

interface MCPToolBrowserProps {
  serverId: string;
  serverName: string;
}

export function MCPToolBrowser({ serverId, serverName }: MCPToolBrowserProps) {
  const { t } = useTranslation();
  const { mcpTools } = useAppStore();
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Load tools
  useEffect(() => {
    const loadTools = async () => {
      setIsLoading(true);
      try {
        const cached = mcpTools.get(serverId);
        if (cached) {
          setTools(cached);
        } else {
          await useAppStore.getState().loadMcpTools(serverId);
          const fresh = useAppStore.getState().mcpTools.get(serverId) || [];
          setTools(fresh);
        }
      } catch (error) {
        console.error('Failed to load tools:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTools();
  }, [serverId, mcpTools]);

  // Filter tools by search query
  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Test a tool
  const handleTestTool = async (tool: MCPTool) => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await api.testMcpTool(serverId, tool.name, {});
      setTestResult(result);
    } catch (error) {
      setTestResult({ error: (error as Error).message });
    } finally {
      setIsTesting(false);
    }
  };

  // Get permission icon
  const getPermissionIcon = (status: MCPTool['permissionStatus']) => {
    switch (status) {
      case 'allowed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'blocked':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  // Get permission text
  const getPermissionText = (status: MCPTool['permissionStatus']) => {
    return t(`mcp.permission.${status}`);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t('mcp.toolBrowser')}</h3>
          <p className="text-sm text-gray-600">{serverName} ({tools.length} {t('mcp.tools')})</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={t('common.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        />
      </div>

      {/* Tools List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">{t('common.loading')}</div>
        ) : filteredTools.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? 'No tools found' : 'No tools available'}
          </div>
        ) : (
          filteredTools.map((tool) => (
            <div
              key={tool.name}
              className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => setSelectedTool(tool)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Wrench className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <h4 className="font-medium text-gray-900">{tool.name}</h4>
                    {getPermissionIcon(tool.permissionStatus)}
                  </div>
                  {tool.description && (
                    <p className="text-sm text-gray-600 ml-6">{tool.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    {getPermissionText(tool.permissionStatus)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTestTool(tool);
                  }}
                  disabled={isTesting}
                  className="px-3 py-1 text-sm bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
                >
                  Test
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tool Details Modal */}
      {selectedTool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{selectedTool.name}</h3>
                <button
                  onClick={() => setSelectedTool(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {selectedTool.description && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                  <p className="text-gray-600">{selectedTool.description}</p>
                </div>
              )}

              {selectedTool.inputSchema && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Input Schema</h4>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                    {JSON.stringify(selectedTool.inputSchema, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => {
                    setSelectedTool(null);
                    handleTestTool(selectedTool);
                  }}
                  disabled={isTesting}
                  className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
                >
                  {isTesting ? 'Testing...' : 'Run Test'}
                </button>
                <button
                  onClick={() => setSelectedTool(null)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Result */}
      {testResult && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Test Result</h4>
          <pre className="text-sm overflow-x-auto">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
