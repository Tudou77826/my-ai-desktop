// ==================== RulesPage Component ====================

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Plus, FileCode, Loader2, Search, Trash2, HelpCircle } from 'lucide-react';
import { Rule } from '../types';
import { api } from '../lib/api';
import { useToast } from './ui/Toast';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Dialog } from './ui/Dialog';
import { RuleEditorDialog } from './RuleEditorDialog';

// Common languages for quick selection
const COMMON_LANGUAGES = [
  'typescript', 'javascript', 'python', 'java', 'go', 'rust',
  'cpp', 'csharp', 'php', 'ruby', 'swift', 'kotlin', 'dart'
];

export function RulesPage() {
  const { t } = useTranslation();
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useToast();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadRules = async () => {
    try {
      setLoading(true);
      const data = await api.getAllRules();
      setRules(data);
    } catch (error) {
      console.error('Failed to load rules:', error);
      showToast(t('rules.toast.loadFailed', { defaultValue: 'Failed to load rules' }), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  // Filter rules based on search query
  const filteredRules = useMemo(() => {
    if (!debouncedQuery) return rules;

    const query = debouncedQuery.toLowerCase();
    return rules.filter(
      (r) =>
        r.id.toLowerCase().includes(query) ||
        r.name.toLowerCase().includes(query) ||
        r.language.toLowerCase().includes(query) ||
        r.content.toLowerCase().includes(query)
    );
  }, [rules, debouncedQuery]);

  const handleRefresh = async () => {
    await loadRules();
    showToast(t('rules.toast.refreshSuccess', { defaultValue: 'Rules refreshed successfully' }), 'success');
  };

  const handleCreate = () => {
    setSelectedRule(null);
    setShowCreateDialog(true);
  };

  const handleEdit = (rule: Rule) => {
    setSelectedRule(rule);
    setShowEditDialog(true);
  };

  const handleDelete = (rule: Rule) => {
    setSelectedRule(rule);
    setShowDeleteDialog(true);
  };

  const handleCreateSubmit = async (language: string, content: string) => {
    try {
      setIsSubmitting(true);
      await api.createRule(language, content);
      setShowCreateDialog(false);
      await loadRules();
      showToast(t('rules.toast.createSuccess', { defaultValue: 'Rule created successfully' }), 'success');
    } catch (error: any) {
      console.error('Failed to create rule:', error);
      const errorMsg = error?.error || t('rules.toast.createFailed', { defaultValue: 'Failed to create rule' });
      showToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (language: string, content: string) => {
    try {
      setIsSubmitting(true);
      await api.updateRule(language, content);
      setShowEditDialog(false);
      await loadRules();
      showToast(t('rules.toast.updateSuccess', { defaultValue: 'Rule updated successfully' }), 'success');
    } catch (error: any) {
      console.error('Failed to update rule:', error);
      const errorMsg = error?.error || t('rules.toast.updateFailed', { defaultValue: 'Failed to update rule' });
      showToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRule) return;

    try {
      setIsSubmitting(true);
      await api.deleteRule(selectedRule.language);
      setShowDeleteDialog(false);
      setSelectedRule(null);
      await loadRules();
      showToast(t('rules.toast.deleteSuccess', { defaultValue: 'Rule deleted successfully' }), 'success');
    } catch (error: any) {
      console.error('Failed to delete rule:', error);
      const errorMsg = error?.error || t('rules.toast.deleteFailed', { defaultValue: 'Failed to delete rule' });
      showToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <FileCode className="w-6 h-6" />
            {t('rules.title', { defaultValue: 'Coding Rules' })}
            <button
              onClick={() => setShowInfoDialog(true)}
              className="ml-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="什么是编码规范？"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {t('rules.description', { defaultValue: 'Manage language-specific coding standards and guidelines' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('common.refresh', { defaultValue: 'Refresh' })}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreate}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('rules.create', { defaultValue: 'Create Rule' })}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder={t('rules.searchPlaceholder', { defaultValue: 'Search rules by language...' })}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Rules List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : filteredRules.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <FileCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            {searchQuery
              ? t('rules.noResults', { defaultValue: 'No rules found matching your search' })
              : t('rules.empty', { defaultValue: 'No coding rules found. Create your first rule to get started.' })}
          </p>
          {!searchQuery && (
            <Button variant="primary" size="sm" onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              {t('rules.createFirst', { defaultValue: 'Create First Rule' })}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRules.map((rule) => (
            <div
              key={rule.id}
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 capitalize">
                      {rule.name}
                    </h3>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {rule.scope}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">
                    {rule.path}
                  </p>
                  <div className="text-sm text-gray-700 line-clamp-3">
                    {rule.content.substring(0, 200)}...
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(rule)}
                  >
                    {t('common.edit', { defaultValue: 'Edit' })}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(rule)}
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <RuleEditorDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateSubmit}
        isSubmitting={isSubmitting}
        mode="create"
        commonLanguages={COMMON_LANGUAGES}
      />

      {/* Edit Dialog */}
      <RuleEditorDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSubmit={handleEditSubmit}
        isSubmitting={isSubmitting}
        mode="edit"
        initialRule={selectedRule}
        commonLanguages={COMMON_LANGUAGES}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowDeleteDialog(false);
            setSelectedRule(null);
          }
        }}
        title={t('rules.deleteTitle', { defaultValue: 'Delete Rule' })}
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            {t('rules.deleteConfirm', {
              defaultValue: 'Are you sure you want to delete the rule for "{{language}}"? This action cannot be undone.',
              language: selectedRule?.language
            })}
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedRule(null);
              }}
              disabled={isSubmitting}
            >
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('common.deleting', { defaultValue: 'Deleting...' })}
                </>
              ) : (
                t('common.delete', { defaultValue: 'Delete' })
              )}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Info Dialog */}
      <Dialog
        open={showInfoDialog}
        onOpenChange={setShowInfoDialog}
        title={t('rules.info.title', { defaultValue: 'What are Coding Rules?' })}
      >
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong className="text-gray-900">是什么？</strong> {t('rules.info.what', { defaultValue: 'Rules are language-specific coding guidelines that Claude Code follows when writing or reviewing code in that language.' })}
          </p>
          <p>
            <strong className="text-gray-900">什么时候生效？</strong> {t('rules.info.when', { defaultValue: 'Automatically applied when Claude Code detects you\'re working with a specific programming language.' })}
          </p>
          <p>
            <strong className="text-gray-900">如何管理？</strong> {t('rules.info.how', { defaultValue: 'Click Edit to modify rules, or Create to add new language guidelines.' })}
          </p>
        </div>
      </Dialog>
    </div>
  );
}
