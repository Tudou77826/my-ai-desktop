// ==================== SkillCard Component ====================

import { BookOpen, User } from 'lucide-react';
import { Switch } from './ui/Switch';
import { Button } from './ui/Button';

interface SkillCardProps {
  skill: {
    id: string;
    path: string;
    scope: string;
    enabled: boolean;
    metadata?: {
      name?: string;
      description?: string;
      author?: string;
    };
  };
  onToggle: (skillId: string, enabled: boolean) => void;
  onViewDetails: (skillId: string) => void;
}

export function SkillCard({ skill, onToggle, onViewDetails }: SkillCardProps) {
  const name = skill.metadata?.name || skill.id;
  const description = skill.metadata?.description || 'No description available';
  const author = skill.metadata?.author;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          <BookOpen className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <h3 className="text-lg font-semibold text-gray-900 truncate">{name}</h3>
        </div>
        <Switch
          checked={skill.enabled}
          onCheckedChange={(checked) => onToggle(skill.id, checked)}
        />
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">{description}</p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
        {author && (
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <User className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{author}</span>
          </div>
        )}
        {!author && <div className="min-h-[20px]" />}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetails(skill.id)}
          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 flex-shrink-0 ml-2"
        >
          View Details
        </Button>
      </div>
    </div>
  );
}
