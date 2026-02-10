// ==================== CommandsList Component ====================

import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Plus, HelpCircle, Terminal } from 'lucide-react';
import { useToast } from './ui/Toast';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Dialog } from './ui/Dialog';
import { CommandCard } from './CommandCard';
import { CommandEditorDialog } from './CommandEditorDialog';
import { Command } from '../types';
import api from '../lib/api';

export function CommandsList() {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [commands, setCommands] = useState<Command[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'builtin' | 'custom'>('all');
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load commands
  const loadCommands = async () => {
    setIsLoading(true);
    try {
      const cmds = await api.getAllCommands();
      setCommands(cmds);
    } catch (error) {
      showToast(t('commands.toast.loadFailed', { defaultValue: 'Failed to load commands' }), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCommands();
  }, []);

  // Filter commands based on search query and type
  const filteredCommands = useMemo(() => {
    let filtered = commands;

    // Filter by type
    if (filterType === 'builtin') {
      filtered = filtered.filter((c) => c.builtin);
    } else if (filterType === 'custom') {
      filtered = filtered.filter((c) => !c.builtin);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.id.toLowerCase().includes(query) ||
          c.name?.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [commands, filterType, searchQuery]);

  const handleRefresh = async () => {
    await loadCommands();
    showToast(t('commands.toast.refreshSuccess', { defaultValue: 'Commands refreshed successfully' }), 'success');
  };

  const handleCreate = async (commandId: string, content: string) => {
    setIsSubmitting(true);
    try {
      await api.createCommand(commandId, content);
      await loadCommands();
      setShowCreateDialog(false);
      showToast(t('commands.toast.createSuccess', { defaultValue: 'Command created successfully' }), 'success');
    } catch (error) {
      showToast(t('commands.toast.createFailed', { defaultValue: 'Failed to create command' }) + ': ' + (error as Error).message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (commandId: string, content: string) => {
    setIsSubmitting(true);
    try {
      await api.updateCommand(commandId, content);
      await loadCommands();
      setShowEditDialog(false);
      setSelectedCommand(null);
      showToast(t('commands.toast.updateSuccess', { defaultValue: 'Command updated successfully' }), 'success');
    } catch (error) {
      showToast(t('commands.toast.updateFailed', { defaultValue: 'Failed to update command' }) + ': ' + (error as Error).message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commandId: string) => {
    if (!confirm(`Are you sure you want to delete command "${commandId}"?`)) {
      return;
    }

    try {
      await api.deleteCommand(commandId);
      await loadCommands();
      showToast(t('commands.toast.deleteSuccess', { defaultValue: 'Command deleted successfully' }), 'success');
    } catch (error) {
      showToast(t('commands.toast.deleteFailed', { defaultValue: 'Failed to delete command' }) + ': ' + (error as Error).message, 'error');
    }
  };

  const handleEdit = (command: Command) => {
    if (command.builtin) {
      showToast(t('commands.toast.builtinCannotEdit', { defaultValue: 'Built-in commands cannot be edited' }), 'error');
      return;
    }
    setSelectedCommand(command);
    setShowEditDialog(true);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          {t('commands.title', { defaultValue: 'Commands Management' })}
          <button
            onClick={() => setShowInfoDialog(true)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title={t('commands.info.title', { defaultValue: 'What are Commands?' })}
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </h1>
        <p className="text-gray-600">
          {t('commands.description', { defaultValue: 'Manage slash commands for quick actions and workflows' })}
        </p>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center gap-4 mb-6">
        {/* Search */}
        <div className="flex-1">
          <Input
            placeholder={t('commands.searchPlaceholder', { defaultValue: 'Search commands...' })}
            showSearchIcon
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Create Command Button */}
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-amber-600 hover:bg-amber-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('commands.createCommand', { defaultValue: 'Create Command' })}
        </Button>

        {/* Refresh Button */}
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t('common.refresh', { defaultValue: 'Refresh' })}
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <Badge
          variant={filterType === 'all' ? 'default' : 'outline'}
          className="cursor-pointer hover:bg-gray-100"
          onClick={() => setFilterType('all')}
        >
          {t('commands.all', { defaultValue: 'All' })} ({commands.length})
        </Badge>
        <Badge
          variant={filterType === 'builtin' ? 'default' : 'outline'}
          className="cursor-pointer hover:bg-gray-100"
          onClick={() => setFilterType('builtin')}
        >
          {t('commands.builtin', { defaultValue: 'Built-in' })} ({commands.filter((c) => c.builtin).length})
        </Badge>
        <Badge
          variant={filterType === 'custom' ? 'default' : 'outline'}
          className="cursor-pointer hover:bg-gray-100"
          onClick={() => setFilterType('custom')}
        >
          {t('commands.custom', { defaultValue: 'Custom' })} ({commands.filter((c) => !c.builtin).length})
        </Badge>
      </div>

      {/* Commands Grid */}
      {filteredCommands.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Terminal className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500">
            {searchQuery || filterType !== 'all'
              ? t('commands.noResults', { defaultValue: 'No commands match your search' })
              : t('commands.noCommands', { defaultValue: 'No commands found' })}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCommands.map((command) => (
            <CommandCard
              key={command.id}
              command={command}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CommandEditorDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
        mode="create"
      />

      {/* Edit Dialog */}
      <CommandEditorDialog
        open={showEditDialog}
        onOpenChange={(open) => {
          setShowEditDialog(open);
          if (!open) setSelectedCommand(null);
        }}
        onSubmit={(commandId, content) => handleUpdate(commandId, content)}
        isSubmitting={isSubmitting}
        mode="edit"
        initialCommand={selectedCommand}
      />

      {/* Info Dialog */}
      <Dialog
        open={showInfoDialog}
        onOpenChange={setShowInfoDialog}
        title={t('commands.info.title', { defaultValue: 'What are Commands?' })}
      >
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong className="text-gray-900">{t('commands.info.whenTitle', { defaultValue: 'When to use?' })}</strong> {t('commands.info.what', { defaultValue: 'Commands are slash commands that provide quick access to common actions and workflows in Claude Code.' })}
          </p>
          <p>
            <strong className="text-gray-900">{t('commands.info.whenTitle', { defaultValue: 'When to use?' })}</strong> {t('commands.info.when', { defaultValue: 'Use commands to automate repetitive tasks, standardize workflows, or create shortcuts for complex operations.' })}
          </p>
          <p>
            <strong className="text-gray-900">{t('commands.info.howTitle', { defaultValue: 'How to manage?' })}</strong> {t('commands.info.how', { defaultValue: 'Create custom commands for your workflow, or use built-in commands provided by Claude Code.' })}
          </p>
        </div>
      </Dialog>
    </div>
  );
}
