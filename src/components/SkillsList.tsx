// ==================== SkillsList Component ====================

import { useEffect, useState, useMemo } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useToast } from './ui/Toast';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { SkillCard } from './SkillCard';
import { SkillDetailDialog } from './SkillDetailDialog';

type FilterStatus = 'all' | 'enabled' | 'disabled';

export function SkillsList() {
  const { data, isLoading, toggleSkill, ui, setSearchQuery, setFilterStatus } = useAppStore();
  const { showToast } = useToast();

  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState(ui.searchQuery);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(ui.searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [ui.searchQuery]);

  // Filter skills based on search query and status
  const filteredSkills = useMemo(() => {
    if (!data?.skills) return [];

    let skills = [...data.skills];

    // Filter by status
    if (ui.filterStatus === 'enabled') {
      skills = skills.filter((s) => s.enabled);
    } else if (ui.filterStatus === 'disabled') {
      skills = skills.filter((s) => !s.enabled);
    }

    // Filter by search query
    if (debouncedQuery) {
      const query = debouncedQuery.toLowerCase();
      skills = skills.filter(
        (s) =>
          s.id.toLowerCase().includes(query) ||
          s.metadata?.name?.toLowerCase().includes(query) ||
          s.metadata?.description?.toLowerCase().includes(query) ||
          s.metadata?.author?.toLowerCase().includes(query)
      );
    }

    return skills;
  }, [data?.skills, ui.filterStatus, debouncedQuery]);

  const selectedSkill = useMemo(
    () => data?.skills.find((s) => s.id === selectedSkillId) || null,
    [data?.skills, selectedSkillId]
  );

  const handleToggle = async (skillId: string, enabled: boolean) => {
    try {
      await toggleSkill(skillId, enabled);
      showToast(
        `Skill ${skillId} ${enabled ? 'enabled' : 'disabled'}`,
        'success'
      );
    } catch (error) {
      showToast(`Failed to toggle skill: ${(error as Error).message}`, 'error');
    }
  };

  const handleRefresh = async () => {
    // Reload data
    const { loadData } = useAppStore.getState();
    try {
      await loadData();
      showToast('Skills refreshed', 'success');
    } catch (error) {
      showToast(`Failed to refresh: ${(error as Error).message}`, 'error');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Skills Management</h1>
        <p className="text-gray-600">Manage your ClaudeCode skills</p>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center gap-4 mb-6">
        {/* Search */}
        <div className="flex-1">
          <Input
            placeholder="Search skills..."
            showSearchIcon
            value={ui.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Refresh Button */}
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <Badge
          variant={ui.filterStatus === 'all' ? 'default' : 'outline'}
          className="cursor-pointer hover:bg-gray-100"
          onClick={() => setFilterStatus('all')}
        >
          All ({data?.skills.length || 0})
        </Badge>
        <Badge
          variant={ui.filterStatus === 'enabled' ? 'default' : 'outline'}
          className="cursor-pointer hover:bg-gray-100"
          onClick={() => setFilterStatus('enabled')}
        >
          Enabled ({data?.skills.filter((s) => s.enabled).length || 0})
        </Badge>
        <Badge
          variant={ui.filterStatus === 'disabled' ? 'default' : 'outline'}
          className="cursor-pointer hover:bg-gray-100"
          onClick={() => setFilterStatus('disabled')}
        >
          Disabled ({data?.skills.filter((s) => !s.enabled).length || 0})
        </Badge>
      </div>

      {/* Skills Grid */}
      {filteredSkills.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Search className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500">
            {debouncedQuery || ui.filterStatus !== 'all'
              ? 'No skills match your filters'
              : 'No skills found'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onToggle={handleToggle}
              onViewDetails={setSelectedSkillId}
            />
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <SkillDetailDialog
        open={selectedSkillId !== null}
        onOpenChange={(open) => !open && setSelectedSkillId(null)}
        skill={selectedSkill}
      />
    </div>
  );
}
