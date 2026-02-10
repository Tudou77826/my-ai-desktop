// ==================== SubAgentCard Component ====================

import { useTranslation } from 'react-i18next';
import { Bot, Globe, FolderOpen, Settings, Eye } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { SubAgent } from '../lib/api';

interface SubAgentCardProps {
  subagent: SubAgent;
  onViewDetails: (subagentId: string) => void;
  onEdit?: (subagent: SubAgent) => void;
  onDelete?: (subagent: SubAgent) => void;
}

export function SubAgentCard({ subagent, onViewDetails, onEdit, onDelete }: SubAgentCardProps) {
  const { t } = useTranslation();
  const isBuiltin = subagent.scope === 'builtin';
  const isUser = subagent.scope === 'user';

  // Get scope badge
  const getScopeBadge = () => {
    if (isBuiltin) {
      return <Badge variant="default" className="bg-amber-100 text-amber-700 hover:bg-amber-100">{t('subagents.builtin')}</Badge>;
    }
    if (isUser) {
      return <Badge variant="outline" className="border-blue-200 text-blue-700">{t('subagents.user')}</Badge>;
    }
    return <Badge variant="outline" className="border-purple-200 text-purple-700">{t('subagents.project')}</Badge>;
  };

  // Get model badge color
  const getModelBadge = () => {
    if (!subagent.model || subagent.model === 'inherit') return null;
    const modelColors: Record<string, string> = {
      sonnet: 'bg-green-100 text-green-700',
      opus: 'bg-purple-100 text-purple-700',
      haiku: 'bg-blue-100 text-blue-700',
      inherit: 'bg-gray-100 text-gray-700',
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded font-medium ${modelColors[subagent.model] || modelColors.inherit}`}>
        {subagent.model}
      </span>
    );
  };

  // Get icon based on scope
  const getScopeIcon = () => {
    if (isBuiltin) return <Globe className="w-5 h-5 text-amber-600" />;
    if (isUser) return <Globe className="w-5 h-5 text-blue-600" />;
    return <FolderOpen className="w-5 h-5 text-purple-600" />;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-all flex flex-col h-full group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {getScopeIcon()}
          <h3 className="text-lg font-semibold text-gray-900 truncate">{subagent.name}</h3>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {getScopeBadge()}
        </div>
      </div>

      {/* Badges */}
      {(subagent.model || subagent.permissionMode || subagent.memory) && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {getModelBadge()}
          {subagent.permissionMode && (
            <Badge variant="outline" className="text-xs border-gray-200">
              {subagent.permissionMode}
            </Badge>
          )}
          {subagent.memory && (
            <Badge variant="outline" className="text-xs border-gray-200">
              {t('subagents.form.memory')}: {subagent.memory}
            </Badge>
          )}
        </div>
      )}

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">{subagent.description}</p>

      {/* Tools/Skills preview */}
      {((subagent.tools && subagent.tools.length > 0) || (subagent.skills && subagent.skills.length > 0)) && (
        <div className="mb-4 space-y-1">
          {subagent.tools && subagent.tools.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Settings className="w-3 h-3" />
              <span className="truncate">{subagent.tools.slice(0, 3).join(', ')}</span>
              {subagent.tools.length > 3 && <span>+{subagent.tools.length - 3}</span>}
            </div>
          )}
          {subagent.skills && subagent.skills.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Bot className="w-3 h-3" />
              <span className="truncate">{subagent.skills.slice(0, 2).join(', ')}</span>
              {subagent.skills.length > 2 && <span>+{subagent.skills.length - 2}</span>}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-400">
          {isBuiltin ? t('subagents.alwaysAvailable') : `ID: ${subagent.id}`}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(subagent.id)}
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
          >
            <Eye className="w-4 h-4" />
          </Button>

          {!isBuiltin && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(subagent)}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}

          {!isBuiltin && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(subagent)}
              className="text-red-600 hover:text-red-900 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
