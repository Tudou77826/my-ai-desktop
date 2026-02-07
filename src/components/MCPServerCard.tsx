// ==================== MCPServerCard Component ====================

import { Zap, Activity } from 'lucide-react';
import { Switch } from './ui/Switch';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

interface MCPServerCardProps {
  server: {
    id: string;
    transport: string;
    enabled: boolean;
    config: {
      command?: string;
      args?: string[];
      url?: string;
    };
    health?: {
      status: 'unknown' | 'ok' | 'error';
      latency?: number;
      lastCheck?: Date;
      error?: string;
    };
  };
  onToggle: (serverId: string, enabled: boolean) => void;
  onTest: (serverId: string) => void;
  onBrowseTools?: (serverId: string) => void;
  testing?: boolean;
}

export function MCPServerCard({ server, onToggle, onTest, onBrowseTools, testing = false }: MCPServerCardProps) {
  // Get health status indicator
  const getHealthStatus = () => {
    if (!server.health) return { color: 'bg-gray-400', label: 'Not tested' };

    switch (server.health.status) {
      case 'ok':
        return {
          color: 'bg-green-500',
          label: server.health.latency ? `${server.health.latency}ms` : 'OK'
        };
      case 'error':
        return { color: 'bg-red-500', label: 'Error' };
      default:
        return { color: 'bg-yellow-500', label: 'Unknown' };
    }
  };

  const healthStatus = getHealthStatus();
  const isTesting = testing;

  // Format latency rating
  const getLatencyRating = (latency?: number) => {
    if (!latency) return null;
    if (latency < 100) return { label: 'Excellent', color: 'text-green-600' };
    if (latency < 300) return { label: 'Good', color: 'text-yellow-600' };
    return { label: 'Slow', color: 'text-red-600' };
  };

  const latencyRating = getLatencyRating(server.health?.latency);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          <Zap className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <h3 className="text-lg font-semibold text-gray-900">{server.id}</h3>
        </div>
        <Switch
          checked={server.enabled}
          onCheckedChange={(checked) => onToggle(server.id, checked)}
        />
      </div>

      {/* Transport Badge */}
      <div className="mb-3">
        <Badge variant="neutral">{server.transport.toUpperCase()}</Badge>
      </div>

      {/* Health Status */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2 h-2 rounded-full ${healthStatus.color} flex-shrink-0`} />
        <span className="text-sm text-gray-600">{healthStatus.label}</span>

        {latencyRating && (
          <span className={`text-sm font-medium ${latencyRating.color}`}>
            ({latencyRating.label})
          </span>
        )}

        {server.health?.lastCheck && (
          <span className="text-xs text-gray-500 ml-auto">
            {new Date(server.health.lastCheck).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Connection Details */}
      {server.transport === 'http' && server.config.url && (
        <p className="text-xs text-gray-500 mb-4 truncate" title={server.config.url}>
          URL: {server.config.url}
        </p>
      )}

      {server.transport === 'stdio' && server.config.command && (
        <p className="text-xs text-gray-500 mb-4 truncate">
          Command: {server.config.command} {server.config.args?.join(' ') || ''}
        </p>
      )}

      {/* Error Message */}
      {server.health?.error && (
        <p className="text-sm text-red-600 mb-3">{server.health.error}</p>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {onBrowseTools && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onBrowseTools(server.id)}
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
          >
            Browse Tools
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onTest(server.id)}
          disabled={isTesting}
          className="flex items-center gap-2"
        >
          <Activity className={`w-4 h-4 ${isTesting ? 'animate-pulse' : ''}`} />
          {isTesting ? 'Testing...' : 'Test Connection'}
        </Button>
      </div>
    </div>
  );
}
