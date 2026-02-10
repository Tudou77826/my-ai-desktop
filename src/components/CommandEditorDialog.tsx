// ==================== CommandEditorDialog Component ====================

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Command } from '../types';
import { Button } from './ui/Button';
import { Dialog } from './ui/Dialog';
import Editor from '@monaco-editor/react';

interface CommandEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (commandId: string, content: string) => void;
  isSubmitting: boolean;
  mode: 'create' | 'edit';
  initialCommand?: Command | null;
}

export function CommandEditorDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  mode,
  initialCommand,
}: CommandEditorDialogProps) {
  const { t } = useTranslation();
  const [commandId, setCommandId] = useState('');
  const [content, setContent] = useState('');

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialCommand) {
        setCommandId(initialCommand.id);
        setContent(initialCommand.content || '');
      } else {
        setCommandId('');
        setContent(`# command-name

Description of what this command does.
`);
      }
    }
  }, [open, mode, initialCommand]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!commandId.trim()) {
      return;
    }

    onSubmit(commandId.trim(), content);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'create'
        ? t('commands.dialog.createTitle', { defaultValue: 'Create Command' })
        : t('commands.dialog.editTitle', { defaultValue: 'Edit Command' })}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Command ID Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('commands.dialog.commandIdLabel', { defaultValue: 'Command ID' })}
          </label>
          <input
            type="text"
            value={commandId}
            onChange={(e) => setCommandId(e.target.value)}
            placeholder={t('commands.dialog.commandIdPlaceholder', { defaultValue: 'my-command' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            disabled={mode === 'edit' || isSubmitting}
            pattern="^[a-z0-9-]+$"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {t('commands.dialog.commandIdHelp', { defaultValue: 'Only lowercase letters, numbers, and hyphens' })}
          </p>
        </div>

        {/* Content Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('commands.dialog.contentLabel', { defaultValue: 'Command Content (Markdown)' })}
          </label>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <Editor
              height="300px"
              language="markdown"
              value={content}
              onChange={(value) => setContent(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || !commandId.trim() || !/^[a-z0-9-]+$/.test(commandId)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {mode === 'create'
                  ? t('common.creating', { defaultValue: 'Creating...' })
                  : t('common.saving', { defaultValue: 'Saving...' })}
              </>
            ) : (
              <>
                {mode === 'create'
                  ? t('common.create', { defaultValue: 'Create' })
                  : t('common.save', { defaultValue: 'Save' })}
              </>
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
