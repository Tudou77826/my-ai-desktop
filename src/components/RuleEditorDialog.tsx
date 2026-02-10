// ==================== RuleEditorDialog Component ====================

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Rule } from '../types';
import { Button } from './ui/Button';
import { Dialog } from './ui/Dialog';
import Editor from '@monaco-editor/react';

interface RuleEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (language: string, content: string) => void;
  isSubmitting: boolean;
  mode: 'create' | 'edit';
  initialRule?: Rule | null;
  commonLanguages?: string[];
}

export function RuleEditorDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  mode,
  initialRule,
  commonLanguages = [],
}: RuleEditorDialogProps) {
  const { t } = useTranslation();
  const [language, setLanguage] = useState('');
  const [content, setContent] = useState('');
  const [selectedCommon, setSelectedCommon] = useState('');

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialRule) {
        setLanguage(initialRule.language);
        setContent(initialRule.content);
      } else {
        setLanguage('');
        setContent('');
      }
      setSelectedCommon('');
    }
  }, [open, mode, initialRule]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!language.trim()) {
      return;
    }

    onSubmit(language.trim(), content);
  };

  const handleSelectCommonLanguage = (lang: string) => {
    setLanguage(lang);
    setSelectedCommon(lang);

    // Set default content for new rules
    if (mode === 'create' && !content) {
      setContent(`# ${lang.charAt(0).toUpperCase() + lang.slice(1)} Coding Rules

Add your coding standards and guidelines for ${lang} here.

## Example Rules

- Use meaningful variable names
- Follow consistent formatting
- Write self-documenting code
- Add comments for complex logic
`);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'create'
        ? t('rules.dialog.createTitle', { defaultValue: 'Create Coding Rule' })
        : t('rules.dialog.editTitle', { defaultValue: 'Edit Coding Rule' })}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Language Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('rules.dialog.languageLabel', { defaultValue: 'Language' })}
          </label>

          {/* Common Languages Quick Select */}
          {mode === 'create' && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2">
                {t('rules.dialog.commonLanguages', { defaultValue: 'Common languages:' })}
              </p>
              <div className="flex flex-wrap gap-2">
                {commonLanguages.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleSelectCommonLanguage(lang)}
                    className={`px-3 py-1 text-sm rounded border transition-colors ${
                      selectedCommon === lang
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          )}

          <input
            type="text"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder={t('rules.dialog.languagePlaceholder', { defaultValue: 'e.g., typescript, python, go' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            disabled={mode === 'edit' || isSubmitting}
            required
          />
          {mode === 'edit' && (
            <p className="text-xs text-gray-500 mt-1">
              {t('rules.dialog.languageLocked', { defaultValue: 'Language cannot be changed in edit mode' })}
            </p>
          )}
        </div>

        {/* Content Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('rules.dialog.contentLabel', { defaultValue: 'Rule Content (Markdown)' })}
          </label>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <Editor
              height="400px"
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
            disabled={isSubmitting || !language.trim()}
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
