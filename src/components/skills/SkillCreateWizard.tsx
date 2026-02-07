// ==================== Skill Create Wizard Component ====================

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/appStore';
import { Button } from '../ui/Button';
import { Wand2, CheckCircle } from 'lucide-react';

interface SkillCreateWizardProps {
  onClose: () => void;
  scope: 'global' | 'project';
  projectPath?: string;
}

export function SkillCreateWizard({ onClose, scope, projectPath }: SkillCreateWizardProps) {
  const { t } = useTranslation();
  const { skillTemplates, createSkill, isCreatingSkill, skillWizardStep, setSkillWizardStep, validateSkillFrontmatter } = useAppStore();

  // Form state
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [skillId, setSkillId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [frontmatter, setFrontmatter] = useState('');
  const [content, setContent] = useState('');
  const [validation, setValidation] = useState<any>(null);

  // Load templates on mount
  useEffect(() => {
    useAppStore.getState().loadSkillTemplates();
  }, []);

  // When template changes, pre-fill form
  useEffect(() => {
    if (selectedTemplate) {
      const template = skillTemplates.find(t => t.id === selectedTemplate);
      if (template) {
        setDisplayName(template.name);
        setDescription(template.description);
        setFrontmatter(`---\n${YAML.stringify(template.frontmatter)}---`);
        setContent(template.content);
      }
    }
  }, [selectedTemplate, skillTemplates]);

  // Validate frontmatter when it changes
  useEffect(() => {
    if (frontmatter) {
      validateFrontmatter();
    }
  }, [frontmatter]);

  const validateFrontmatter = async () => {
    try {
      const result = await validateSkillFrontmatter(frontmatter);
      setValidation(result);
    } catch (error) {
      setValidation({ valid: false, errors: [(error as Error).message] });
    }
  };

  const handleCreateSkill = async () => {
    try {
      const parsedFrontmatter = YAML.parse(frontmatter.replace(/^---\r?\n|\r?\n---$/g, ''));

      await createSkill(scope, {
        id: skillId || selectedTemplate || 'custom-skill',
        name: displayName,
        description,
        author,
        frontmatter: parsedFrontmatter,
        content,
      }, projectPath);

      onClose();
    } catch (error) {
      console.error('Failed to create skill:', error);
    }
  };

  const canGoNext = () => {
    switch (skillWizardStep) {
      case 0:
        return selectedTemplate || (skillId && displayName);
      case 1:
        return validation?.valid;
      case 2:
        return content.length > 0;
      default:
        return false;
    }
  };

  const steps = [
    { id: 'basic', title: t('skills.wizard.step1') },
    { id: 'frontmatter', title: t('skills.wizard.step2') },
    { id: 'content', title: t('skills.wizard.step3') },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Wand2 className="w-6 h-6 text-amber-600" />
              {t('skills.createSkill')}
            </h2>
            <button
              onClick={onClose}
              disabled={isCreatingSkill}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              ✕
            </button>
          </div>

          {/* Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index === skillWizardStep
                        ? 'bg-amber-600 text-white'
                        : index < skillWizardStep
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index < skillWizardStep ? <CheckCircle className="w-4 h-4" /> : index + 1}
                  </div>
                  <span className={`ml-2 text-sm ${
                    index === skillWizardStep ? 'font-medium text-gray-900' : 'text-gray-600'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    index < skillWizardStep ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {skillWizardStep === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('skills.wizard.selectTemplate')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {skillTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${
                        selectedTemplate === template.id
                          ? 'border-amber-600 bg-amber-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h3 className="font-medium text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      <span className="inline-block mt-2 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        {template.category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-sm text-gray-500">
                Or create a custom skill with unique ID:
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('skills.wizard.skillId')}
                  </label>
                  <input
                    type="text"
                    value={skillId}
                    onChange={(e) => setSkillId(e.target.value)}
                    placeholder="my-custom-skill"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('skills.wizard.displayName')}
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="My Custom Skill"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('skills.wizard.description')}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Describe what your skill does..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('skills.wizard.author')}
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          {skillWizardStep === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">{t('skills.wizard.frontmatterHelp')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frontmatter (YAML)
                </label>
                <textarea
                  value={frontmatter}
                  onChange={(e) => setFrontmatter(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  spellCheck={false}
                />
              </div>

              {validation && (
                <div className={`p-3 rounded-lg ${
                  validation.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  {validation.valid ? (
                    <p className="text-sm text-green-800 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Frontmatter is valid
                    </p>
                  ) : (
                    <div className="text-sm text-red-800">
                      <p className="font-medium mb-1">Validation errors:</p>
                      <ul className="list-disc list-inside">
                        {validation.errors.map((error: string, i: number) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {validation.warnings && validation.warnings.length > 0 && (
                    <div className="mt-2 text-sm text-yellow-700">
                      <p className="font-medium mb-1">Warnings:</p>
                      <ul className="list-disc list-inside">
                        {validation.warnings.map((warning: string, i: number) => (
                          <li key={i}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {skillWizardStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('skills.wizard.writeContent')}
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={16}
                  placeholder="# My Skill&#10;&#10;Describe your skill here...&#10;&#10;## Usage&#10;&#10;```&#10;/my-skill [arguments]&#10;```"
                  className="w-full px-3 py-2 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  spellCheck={false}
                />
              </div>

              <div className="text-sm text-gray-500">
                You can use Markdown formatting. Include usage examples and documentation for your skill.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-between">
          <Button
            variant="ghost"
            onClick={() => setSkillWizardStep(Math.max(0, skillWizardStep - 1))}
            disabled={skillWizardStep === 0 || isCreatingSkill}
          >
            {t('common.previous')}
          </Button>

          {skillWizardStep < steps.length - 1 ? (
            <Button
              onClick={() => setSkillWizardStep(skillWizardStep + 1)}
              disabled={!canGoNext() || isCreatingSkill}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {t('common.next')}
            </Button>
          ) : (
            <Button
              onClick={handleCreateSkill}
              disabled={!canGoNext() || isCreatingSkill}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isCreatingSkill ? t('common.loading') : t('common.create')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple YAML stringifier for frontmatter
const YAML = {
  stringify(obj: any): string {
    const lines: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        lines.push(`${key}:`);
        value.forEach((item) => lines.push(`  - ${item}`));
      } else if (typeof value === 'boolean') {
        lines.push(`${key}: ${value}`);
      } else if (value) {
        lines.push(`${key}: ${value}`);
      }
    }
    return lines.join('\n');
  },
  parse(str: string): any {
    // Simple YAML parser - for production use js-yaml
    const obj: any = {};
    const lines = str.split('\n');
    let currentKey: string | null = null;

    for (const line of lines) {
      const match = line.match(/^(\s*)([\w-]+):\s*(.*)$/);
      if (match) {
        const [, indent, key, value] = match;
        if (indent.length === 0) {
          currentKey = key;
          obj[key] = value || true;
        } else if (currentKey && Array.isArray(obj[currentKey])) {
          // Array item
          const arrayMatch = line.match(/^\s*-\s*(.+)$/);
          if (arrayMatch) {
            (obj[currentKey] as string[]).push(arrayMatch[1]);
          }
        }
      }
    }

    return obj;
  }
};
