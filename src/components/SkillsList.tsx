// ==================== SkillsList Component ====================

import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, RefreshCw, Plus, HelpCircle } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useToast } from './ui/Toast';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Dialog } from './ui/Dialog';
import { SkillCard } from './SkillCard';
import { SkillDetailDialog } from './SkillDetailDialog';
import { SkillCreateWizard } from './skills/SkillCreateWizard';
import { WishlistPanel } from './WishlistPanel';

export function SkillsList() {
  const { t } = useTranslation();
  const { data, isLoading, toggleSkill, ui, setSearchQuery, setFilterStatus } = useAppStore();
  const { showToast } = useToast();

  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          Skills Management
          <button
            onClick={() => setShowInfoDialog(true)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="什么是 Skills？"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </h1>
        <p className="text-gray-600">Manage your ClaudeCode skills</p>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center gap-4 mb-6">
        {/* Search */}
        <div className="flex-1">
          <Input
            placeholder={t('common.search')}
            showSearchIcon
            value={ui.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Create Skill Button */}
        <Button
          onClick={() => setShowCreateWizard(true)}
          className="bg-amber-600 hover:bg-amber-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('skills.createSkill')}
        </Button>

        {/* Refresh Button */}
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
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

      {/* Wishlist */}
      <div className="mt-6">
        <WishlistPanel type="skills" />
      </div>

      {/* Detail Dialog */}
      <SkillDetailDialog
        open={selectedSkillId !== null}
        onOpenChange={(open) => !open && setSelectedSkillId(null)}
        skill={selectedSkill}
      />

      {/* Create Skill Wizard */}
      {showCreateWizard && (
        <SkillCreateWizard
          onClose={() => setShowCreateWizard(false)}
          scope="global"
        />
      )}

      {/* Info Dialog */}
      <Dialog
        open={showInfoDialog}
        onOpenChange={setShowInfoDialog}
        title={t('skills.info.title', { defaultValue: 'What are Skills?' })}
      >
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong className="text-gray-900">是什么？</strong> {t('skills.info.what', { defaultValue: 'Skills are reusable prompt templates that extend Claude Code\'s capabilities for specific tasks or workflows.' })}
          </p>
          <p>
            <strong className="text-gray-900">什么时候使用？</strong> {t('skills.info.when', { defaultValue: 'Use skills to standardize repetitive tasks like testing, documentation, or code patterns.' })}
          </p>
          <p>
            <strong className="text-gray-900">如何管理？</strong> {t('skills.info.how', { defaultValue: 'Toggle skills on/off to enable them globally or create custom skills for your projects.' })}
          </p>
        </div>
      </Dialog>
    </div>
  );
}
