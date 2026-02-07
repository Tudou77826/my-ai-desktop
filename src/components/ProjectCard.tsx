// ==================== ProjectCard Component ====================

import { Folder, FolderOpen, Clock, Package, Zap } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    path: string;
    exists: boolean;
    lastModified?: Date;
    hasClaudeConfig?: boolean;
    hasClaudeMd?: boolean;
  };
  onViewDetails: (projectId: string) => void;
}

export function ProjectCard({ project, onViewDetails }: ProjectCardProps) {
  // Format last modified time
  const formatLastModified = (date?: Date) => {
    if (!date) return 'Unknown';
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {project.hasClaudeConfig ? (
            <FolderOpen className="w-5 h-5 text-amber-600 flex-shrink-0" />
          ) : (
            <Folder className="w-5 h-5 text-amber-600 flex-shrink-0" />
          )}
          <h3 className="text-lg font-semibold text-gray-900 truncate">{project.name}</h3>
        </div>
      </div>

      {/* Path */}
      <p className="text-xs text-gray-500 mb-4 truncate" title={project.path}>
        {project.path}
      </p>

      {/* Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>Last modified: {formatLastModified(project.lastModified)}</span>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2">
          {project.hasClaudeConfig && (
            <Badge variant="neutral" className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              Config
            </Badge>
          )}
          {project.hasClaudeMd && (
            <Badge variant="neutral" className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              CLAUDE.md
            </Badge>
          )}
          {!project.hasClaudeConfig && !project.hasClaudeMd && (
            <Badge variant="outline">Basic</Badge>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetails(project.id)}
          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
        >
          View Details
        </Button>
      </div>
    </div>
  );
}
