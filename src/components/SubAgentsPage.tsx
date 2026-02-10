// ==================== SubAgentsPage Component ====================

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Plus, Bot, Loader2, HelpCircle } from 'lucide-react';
import { api, SubAgent } from '../lib/api';
import { useToast } from './ui/Toast';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Dialog } from './ui/Dialog';
import { SubAgentCard } from './SubAgentCard';
import { WishlistPanel } from './WishlistPanel';

type FilterScope = 'all' | 'builtin' | 'user' | 'project';

export function SubAgentsPage() {
  const { t } = useTranslation();
  const [subagents, setSubagents] = useState<SubAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filterScope, setFilterScope] = useState<FilterScope>('all');

  // Detail/Edit state
  const [selectedSubAgentId, setSelectedSubAgentId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    scope: 'user' as 'user' | 'project',
    tools: '',
    disallowedTools: '',
    model: '' as 'sonnet' | 'opus' | 'haiku' | 'inherit' | '',
    permissionMode: '' as 'default' | 'acceptEdits' | 'delegate' | 'dontAsk' | 'bypassPermissions' | 'plan' | '',
    maxTurns: '',
    skills: '',
    mcpServers: '',
    memory: '' as 'user' | 'project' | 'local' | '',
    content: '',
  });

  // Create mode state
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Info dialog state
  const [showInfoDialog, setShowInfoDialog] = useState(false);

  const { showToast } = useToast();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadSubAgents = async () => {
    try {
      setLoading(true);
      const { subagents: data } = await api.getSubAgents();
      setSubagents(data);
    } catch (error) {
      console.error('Failed to load subagents:', error);
      showToast(t('subagents.toast.loadFailed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubAgents();
  }, []);

  // Filter subagents based on search query and scope
  const filteredSubagents = useMemo(() => {
    let result = [...subagents];

    // Filter by scope
    if (filterScope !== 'all') {
      result = result.filter((s) => s.scope === filterScope);
    }

    // Filter by search query
    if (debouncedQuery) {
      const query = debouncedQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.id.toLowerCase().includes(query) ||
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          (s.tools && s.tools.some((t) => t.toLowerCase().includes(query))) ||
          (s.skills && s.skills.some((sk) => sk.toLowerCase().includes(query)))
      );
    }

    return result;
  }, [subagents, filterScope, debouncedQuery]);

  const selectedSubAgent = useMemo(
    () => subagents.find((s) => s.id === selectedSubAgentId) || null,
    [subagents, selectedSubAgentId]
  );

  const handleRefresh = async () => {
    await loadSubAgents();
    showToast(t('subagents.toast.refreshSuccess'), 'success');
  };

  const handleViewDetails = (subagentId: string) => {
    setSelectedSubAgentId(subagentId);
    setIsEditMode(false);
  };

  const handleEdit = (subagent: SubAgent) => {
    if (subagent.scope === 'builtin') {
      showToast(t('subagents.details.builtinCannotEdit'), 'error');
      return;
    }

    setSelectedSubAgentId(subagent.id);
    setIsEditMode(true);

    // Pre-fill form data
    setFormData({
      name: subagent.name,
      description: subagent.description,
      scope: subagent.scope,
      tools: subagent.tools?.join(', ') || '',
      disallowedTools: subagent.disallowedTools?.join(', ') || '',
      model: subagent.model || '',
      permissionMode: subagent.permissionMode || '',
      maxTurns: subagent.maxTurns?.toString() || '',
      skills: subagent.skills?.join(', ') || '',
      mcpServers: subagent.mcpServers ? JSON.stringify(subagent.mcpServers, null, 2) : '',
      memory: subagent.memory || '',
      content: subagent.content || '',
    });
  };

  const handleDelete = async (subagent: SubAgent) => {
    if (subagent.scope === 'builtin') {
      showToast(t('subagents.details.builtinCannotDelete'), 'error');
      return;
    }

    if (!confirm(t('subagents.details.deleteConfirm', { name: subagent.name }))) {
      return;
    }

    try {
      await api.deleteSubAgent(subagent.id, subagent.scope);
      await loadSubAgents();
      showToast(t('subagents.toast.deleteSuccess', { name: subagent.name }), 'success');
      if (selectedSubAgentId === subagent.id) {
        setSelectedSubAgentId(null);
      }
    } catch (error) {
      console.error('Failed to delete subagent:', error);
      showToast(t('subagents.toast.deleteFailed'), 'error');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const tools = formData.tools.split(',').map((t) => t.trim()).filter(Boolean);
      const disallowedTools = formData.disallowedTools.split(',').map((t) => t.trim()).filter(Boolean);
      const skills = formData.skills.split(',').map((s) => s.trim()).filter(Boolean);

      let mcpServers: string[] | Record<string, any> | undefined;
      if (formData.mcpServers.trim()) {
        try {
          mcpServers = JSON.parse(formData.mcpServers);
        } catch {
          showToast(t('subagents.toast.invalidJson'), 'error');
          return;
        }
      }

      const subagentData: Partial<SubAgent> & { name: string; description: string; scope: 'user' | 'project' } = {
        name: formData.name,
        description: formData.description,
        scope: formData.scope,
        tools: tools.length > 0 ? tools : undefined,
        disallowedTools: disallowedTools.length > 0 ? disallowedTools : undefined,
        model: formData.model || undefined,
        permissionMode: formData.permissionMode || undefined,
        maxTurns: formData.maxTurns ? parseInt(formData.maxTurns) : undefined,
        skills: skills.length > 0 ? skills : undefined,
        mcpServers,
        memory: formData.memory || undefined,
        content: formData.content,
      };

      if (isEditMode && selectedSubAgent) {
        // Update existing
        await api.saveSubAgent({ ...subagentData, id: selectedSubAgent.id });
        showToast(t('subagents.toast.updateSuccess'), 'success');
      } else {
        // Create new
        await api.saveSubAgent(subagentData);
        showToast(t('subagents.toast.createSuccess'), 'success');
      }

      // Close form and reload
      setShowCreateForm(false);
      setSelectedSubAgentId(null);
      setIsEditMode(false);
      await loadSubAgents();

      // Reset form
      setFormData({
        name: '',
        description: '',
        scope: 'user',
        tools: '',
        disallowedTools: '',
        model: '',
        permissionMode: '',
        maxTurns: '',
        skills: '',
        mcpServers: '',
        memory: '',
        content: '',
      });
    } catch (error) {
      console.error('Failed to save subagent:', error);
      showToast(t('subagents.toast.saveFailed'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get counts for badges
  const getCounts = () => ({
    all: subagents.length,
    builtin: subagents.filter((s) => s.scope === 'builtin').length,
    user: subagents.filter((s) => s.scope === 'user').length,
    project: subagents.filter((s) => s.scope === 'project').length,
  });

  const counts = getCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          {t('subagents.title')}
          <button
            onClick={() => setShowInfoDialog(true)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="什么是 SubAgents？"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </h1>
        <p className="text-gray-600">Manage your Claude Code subagents</p>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center gap-4 mb-6">
        {/* Search */}
        <div className="flex-1">
          <Input
            placeholder={t('subagents.searchPlaceholder')}
            showSearchIcon
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Create SubAgent Button */}
        <Button
          onClick={() => {
            setShowCreateForm(true);
            setFormData({
              name: '',
              description: '',
              scope: 'user',
              tools: '',
              disallowedTools: '',
              model: '',
              permissionMode: '',
              maxTurns: '',
              skills: '',
              mcpServers: '',
              memory: '',
              content: '',
            });
          }}
          className="bg-amber-600 hover:bg-amber-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('subagents.createSubAgent')}
        </Button>

        {/* Refresh Button */}
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <Badge
          variant={filterScope === 'all' ? 'default' : 'outline'}
          className="cursor-pointer hover:bg-gray-100"
          onClick={() => setFilterScope('all')}
        >
          {t('subagents.all')} ({counts.all})
        </Badge>
        <Badge
          variant={filterScope === 'builtin' ? 'default' : 'outline'}
          className="cursor-pointer hover:bg-gray-100"
          onClick={() => setFilterScope('builtin')}
        >
          {t('subagents.builtin')} ({counts.builtin})
        </Badge>
        <Badge
          variant={filterScope === 'user' ? 'default' : 'outline'}
          className="cursor-pointer hover:bg-gray-100"
          onClick={() => setFilterScope('user')}
        >
          {t('subagents.user')} ({counts.user})
        </Badge>
        <Badge
          variant={filterScope === 'project' ? 'default' : 'outline'}
          className="cursor-pointer hover:bg-gray-100"
          onClick={() => setFilterScope('project')}
        >
          {t('subagents.project')} ({counts.project})
        </Badge>
      </div>

      {/* SubAgents Grid */}
      {filteredSubagents.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Bot className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500">
            {debouncedQuery || filterScope !== 'all'
              ? t('subagents.noResults')
              : t('subagents.noSubAgents')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubagents.map((subagent) => (
            <SubAgentCard
              key={subagent.id}
              subagent={subagent}
              onViewDetails={handleViewDetails}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Wishlist */}
      <div className="mt-6">
        <WishlistPanel type="subagents" />
      </div>

      {/* Detail/Edit Dialog */}
      {(selectedSubAgentId || showCreateForm) && (
        <Dialog
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedSubAgentId(null);
              setIsEditMode(false);
              setShowCreateForm(false);
            }
          }}
          title={isEditMode ? `${t('common.edit')} SubAgent` : showCreateForm ? `${t('common.create')} SubAgent` : t('subagents.details.title')}
          footer={
            isEditMode || showCreateForm ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedSubAgentId(null);
                    setIsEditMode(false);
                    setShowCreateForm(false);
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('common.saving')}
                    </>
                  ) : isEditMode ? (
                    t('common.save')
                  ) : (
                    t('common.create')
                  )}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  setSelectedSubAgentId(null);
                }}
              >
                {t('common.close')}
              </Button>
            )
          }
          className="max-w-3xl"
        >
          {isEditMode || showCreateForm ? (
            // Edit/Create Form
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('subagents.form.name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    pattern="^[a-z0-9-]+$"
                    title={t('subagents.form.nameHelp')}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder={t('subagents.form.namePlaceholder')}
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('subagents.form.nameHelp')}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('subagents.form.scope')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.scope}
                    onChange={(e) => setFormData({ ...formData, scope: e.target.value as 'user' | 'project' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="user">{t('subagents.form.scopeUser')}</option>
                    <option value="project">{t('subagents.form.scopeProject')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('subagents.form.description')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder={t('subagents.form.descriptionPlaceholder')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('subagents.form.model')}
                  </label>
                  <select
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="">{t('subagents.form.modelInherit')}</option>
                    <option value="sonnet">{t('subagents.form.modelSonnet')}</option>
                    <option value="opus">{t('subagents.form.modelOpus')}</option>
                    <option value="haiku">{t('subagents.form.modelHaiku')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('subagents.form.maxTurns')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxTurns}
                    onChange={(e) => setFormData({ ...formData, maxTurns: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder={t('subagents.form.maxTurnsPlaceholder')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('subagents.form.permissionMode')}
                  </label>
                  <select
                    value={formData.permissionMode}
                    onChange={(e) => setFormData({ ...formData, permissionMode: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="">{t('subagents.form.permissionDefault')}</option>
                    <option value="acceptEdits">{t('subagents.form.permissionAcceptEdits')}</option>
                    <option value="delegate">{t('subagents.form.permissionDelegate')}</option>
                    <option value="dontAsk">{t('subagents.form.permissionDontAsk')}</option>
                    <option value="bypassPermissions">{t('subagents.form.permissionBypassPermissions')}</option>
                    <option value="plan">{t('subagents.form.permissionPlan')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('subagents.form.memory')}
                  </label>
                  <select
                    value={formData.memory}
                    onChange={(e) => setFormData({ ...formData, memory: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="">{t('subagents.form.memoryNone')}</option>
                    <option value="user">{t('subagents.form.memoryUser')}</option>
                    <option value="project">{t('subagents.form.memoryProject')}</option>
                    <option value="local">{t('subagents.form.memoryLocal')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('subagents.form.tools')}
                </label>
                <input
                  type="text"
                  value={formData.tools}
                  onChange={(e) => setFormData({ ...formData, tools: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder={t('subagents.form.toolsPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('subagents.form.disallowedTools')}
                </label>
                <input
                  type="text"
                  value={formData.disallowedTools}
                  onChange={(e) => setFormData({ ...formData, disallowedTools: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder={t('subagents.form.disallowedToolsPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('subagents.form.skills')}
                </label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder={t('subagents.form.skillsPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('subagents.form.mcpServers')}
                </label>
                <textarea
                  value={formData.mcpServers}
                  onChange={(e) => setFormData({ ...formData, mcpServers: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono text-sm"
                  rows={3}
                  placeholder={t('subagents.form.mcpServersPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('subagents.form.systemPrompt')}
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono text-sm"
                  rows={6}
                  placeholder={t('subagents.form.systemPromptPlaceholder')}
                />
              </div>
            </form>
          ) : selectedSubAgent ? (
            // View Details Mode
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">{selectedSubAgent.name}</h3>
                  <p className="text-sm text-gray-500">{t('subagents.details.id')}: {selectedSubAgent.id}</p>
                </div>
                {selectedSubAgent.scope !== 'builtin' && (
                  <Button onClick={() => handleEdit(selectedSubAgent)} variant="outline">
                    {t('subagents.details.edit')}
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">{t('subagents.details.scope')}:</span>
                  <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                    {selectedSubAgent.scope}
                  </span>
                </div>
                {selectedSubAgent.model && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">{t('subagents.form.model')}:</span>
                    <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                      {selectedSubAgent.model}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">{t('subagents.form.description')}</h4>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  {selectedSubAgent.description}
                </p>
              </div>

              {selectedSubAgent.content && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{t('subagents.details.systemPrompt')}</h4>
                  <pre className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 overflow-auto max-h-40 font-mono">
                    {selectedSubAgent.content}
                  </pre>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedSubAgent.permissionMode && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">{t('subagents.form.permissionMode')}</h4>
                    <span className="px-2 py-0.5 text-xs bg-purple-50 text-purple-700 rounded">
                      {selectedSubAgent.permissionMode}
                    </span>
                  </div>
                )}
                {selectedSubAgent.memory && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">{t('subagents.form.memory')}</h4>
                    <span className="px-2 py-0.5 text-xs bg-green-50 text-green-700 rounded">
                      {selectedSubAgent.memory}
                    </span>
                  </div>
                )}
                {selectedSubAgent.maxTurns && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">{t('subagents.form.maxTurns')}</h4>
                    <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded">
                      {selectedSubAgent.maxTurns}
                    </span>
                  </div>
                )}
              </div>

              {selectedSubAgent.tools && selectedSubAgent.tools.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{t('subagents.details.tools')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSubAgent.tools.map((tool) => (
                      <span key={tool} className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedSubAgent.disallowedTools && selectedSubAgent.disallowedTools.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{t('subagents.details.disallowedTools')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSubAgent.disallowedTools.map((tool) => (
                      <span key={tool} className="px-2 py-0.5 text-xs bg-red-50 text-red-700 rounded">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedSubAgent.skills && selectedSubAgent.skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{t('subagents.details.skills')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSubAgent.skills.map((skill) => (
                      <span key={skill} className="px-2 py-0.5 text-xs bg-amber-50 text-amber-700 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedSubAgent.mcpServers && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{t('subagents.details.mcpServers')}</h4>
                  <pre className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 overflow-auto font-mono">
                    {JSON.stringify(selectedSubAgent.mcpServers, null, 2)}
                  </pre>
                </div>
              )}

              {selectedSubAgent.filePath && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{t('subagents.details.filePath')}</h4>
                  <code className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded block break-all">
                    {selectedSubAgent.filePath}
                  </code>
                </div>
              )}
            </div>
          ) : null}
        </Dialog>
      )}

      {/* Info Dialog */}
      <Dialog
        open={showInfoDialog}
        onOpenChange={setShowInfoDialog}
        title={t('subagents.info.title', { defaultValue: 'What are SubAgents?' })}
      >
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong className="text-gray-900">是什么？</strong> {t('subagents.info.what', { defaultValue: 'SubAgents are specialized AI assistants that can handle specific tasks with defined tools, skills, and permissions.' })}
          </p>
          <p>
            <strong className="text-gray-900">什么时候使用？</strong> {t('subagents.info.when', { defaultValue: 'Use SubAgents for complex tasks like code review, testing, security analysis, or refactoring.' })}
          </p>
          <p>
            <strong className="text-gray-900">如何管理？</strong> {t('subagents.info.how', { defaultValue: 'Create custom SubAgents for your workflow, or use built-in agents provided by Claude Code.' })}
          </p>
        </div>
      </Dialog>
    </div>
  );
}
