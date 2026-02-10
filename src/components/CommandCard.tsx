// ==================== CommandCard Component ====================

import { Terminal, Edit, Trash2 } from 'lucide-react';
import { Command } from '../types';
import { Badge } from './ui/Badge';

interface CommandCardProps {
  command: Command;
  onEdit: (command: Command) => void;
  onDelete: (commandId: string) => void;
}

export function CommandCard({ command, onEdit, onDelete }: CommandCardProps) {
  const isBuiltin = command.builtin;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-amber-600" />
          <h3 className="font-semibold text-gray-900">/{command.id}</h3>
          <Badge variant={isBuiltin ? 'outline' : 'default'} className="text-xs">
            {isBuiltin ? 'Built-in' : 'Custom'}
          </Badge>
        </div>
        {!isBuiltin && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(command)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(command.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-3">
        {command.description || 'No description'}
      </p>

      {/* Metadata */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        {command.lastModified && (
          <span>
            Modified {new Date(command.lastModified).toLocaleDateString()}
          </span>
        )}
        {command.path && (
          <span className="truncate" title={command.path}>
            {command.path.split(/[/\\]/).slice(-2).join('/')}
          </span>
        )}
      </div>
    </div>
  );
}
