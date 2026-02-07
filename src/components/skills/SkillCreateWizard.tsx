// ==================== Skill Create Wizard Component ====================

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/appStore';
import { Button } from '../ui/Button';
import { Wand2, CheckCircle, Info, HelpCircle } from 'lucide-react';

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
        setFrontmatter(`---\n${YAML.stringify(template.frontmatter)}\n---`);
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
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Wand2 className="w-6 h-6 text-amber-600" />
              {t('skills.createSkill')}
            </h2>
            <button
              onClick={onClose}
              disabled={isCreatingSkill}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      index === skillWizardStep
                        ? 'bg-amber-600 text-white'
                        : index < skillWizardStep
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index < skillWizardStep ? <CheckCircle className="w-5 h-5" /> : index + 1}
                  </div>
                  <span className={`text-xs mt-1 font-medium ${
                    index === skillWizardStep ? 'text-amber-600' : index < skillWizardStep ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mt-[-26px] ${
                    index < skillWizardStep ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {skillWizardStep === 0 && (
            <div className="space-y-6">
              {/* Step description */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-1">选择模板或创建自定义 Skill</p>
                    <p className="text-blue-700">
                      模板可以帮助您快速开始。如果您有特定需求，也可以选择"自定义 Skill"从头创建。
                      每个 Skill 都需要一个唯一的 ID（如：my-custom-skill）和显示名称。
                    </p>
                  </div>
                </div>
              </div>

              {/* Template selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('skills.wizard.selectTemplate')}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {skillTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                        selectedTemplate === template.id
                          ? 'border-amber-600 bg-amber-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                          {template.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <HelpCircle className="w-3 h-3" />
                        <span>点击选择此模板</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom skill divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">或者自定义 Skill</span>
                </div>
              </div>

              {/* Custom skill form */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-4">创建自定义 Skill - 填写以下信息</p>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('skills.wizard.skillId')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={skillId}
                        onChange={(e) => setSkillId(e.target.value)}
                        placeholder="my-custom-skill"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">唯一标识符，只能包含字母、数字和连字符</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('skills.wizard.displayName')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="My Custom Skill"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">显示在用户界面的名称</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('skills.wizard.description')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      placeholder="简要描述您的 Skill 功能..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">可选：作者名称或联系方式</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {skillWizardStep === 1 && (
            <div className="space-y-4">
              {/* Step description */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-900 mb-1">配置 Frontmatter</p>
                    <p className="text-amber-700">
                      Frontmatter 是 Skill 的配置元数据，使用 YAML 格式。它定义了 Skill 的参数、权限、使用说明等。
                      下方已根据您选择的模板预填充了配置，您可以根据需要修改。
                    </p>
                  </div>
                </div>
              </div>

              {/* YAML editor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Frontmatter (YAML)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      // Reset to template frontmatter
                      if (selectedTemplate) {
                        const template = skillTemplates.find(t => t.id === selectedTemplate);
                        if (template) {
                          setFrontmatter(`---\n${YAML.stringify(template.frontmatter)}\n---`);
                        }
                      }
                    }}
                    className="text-xs text-amber-600 hover:text-amber-700"
                  >
                    重置为模板默认值
                  </button>
                </div>
                <textarea
                  value={frontmatter}
                  onChange={(e) => setFrontmatter(e.target.value)}
                  rows={15}
                  className="w-full px-3 py-2 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  spellCheck={false}
                />
                <div className="mt-2 text-xs text-gray-500">
                  <p>💡 提示：YAML 格式要求严格的缩进（使用空格，不要使用 Tab）</p>
                </div>
              </div>

              {/* Validation status */}
              {validation && (
                <div className={`p-4 rounded-lg border ${
                  validation.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  {validation.valid ? (
                    <div className="flex items-center gap-2 text-sm text-green-800">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">Frontmatter 格式验证通过</span>
                    </div>
                  ) : (
                    <div className="text-sm text-red-800">
                      <p className="font-medium mb-2 flex items-center gap-2">
                        ❌ 验证失败，请检查以下问题：
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        {validation.errors.map((error: string, i: number) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {validation.warnings && validation.warnings.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-red-200">
                      <p className="text-xs font-medium text-yellow-700 mb-1">⚠️ 警告：</p>
                      <ul className="list-disc list-inside text-xs text-yellow-700 space-y-1">
                        {validation.warnings.map((warning: string, i: number) => (
                          <li key={i}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Help section */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">常见 Frontmatter 字段说明：</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <code className="text-amber-700">api:</code>
                    <span className="text-gray-600 ml-2">Skill 需要调用的 API 或权限</span>
                  </div>
                  <div>
                    <code className="text-amber-700">arguments:</code>
                    <span className="text-gray-600 ml-2">Skill 接受的参数定义</span>
                  </div>
                  <div>
                    <code className="text-amber-700">examples:</code>
                    <span className="text-gray-600 ml-2">使用示例数组</span>
                  </div>
                  <div>
                    <code className="text-amber-700">exclude_from_prompts:</code>
                    <span className="text-gray-600 ml-2">是否从自动提示中排除</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {skillWizardStep === 2 && (
            <div className="space-y-4">
              {/* Step description */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-green-900 mb-1">编写 Skill 内容</p>
                    <p className="text-green-700">
                      这是 Skill 的主体部分，使用 Markdown 格式编写。内容应该清楚地说明：
                      Skill 的用途、使用方法、参数说明、注意事项等。您可以使用标准的 Markdown 语法。
                    </p>
                  </div>
                </div>
              </div>

              {/* Content editor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('skills.wizard.writeContent')}
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={20}
                  placeholder={`# My Skill

## 功能说明

描述您的 Skill 的主要功能和用途...

## 使用方法

\`\`\`
/my-skill [参数]
\`\`\`

## 参数说明

- \`参数1\`: 说明参数1的用途
- \`参数2\`: 说明参数2的用途

## 示例

\`\`\`
/my-skill example-arg
\`\`\`

## 注意事项

- 注意事项1
- 注意事项2
`}
                  className="w-full px-3 py-2 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  spellCheck={false}
                />
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>💡 提示：支持 Markdown 语法，包括标题、列表、代码块等</span>
                  <span>字符数：{content.length}</span>
                </div>
              </div>

              {/* Content preview hint */}
              {content.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700">
                    ✍️ 您已输入 {content.length} 个字符。建议 Skill 内容至少包含：功能说明、使用方法、示例。
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex-shrink-0 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => setSkillWizardStep(Math.max(0, skillWizardStep - 1))}
            disabled={skillWizardStep === 0 || isCreatingSkill}
            className="gap-2"
          >
            ← {t('common.previous')}
          </Button>

          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">
              步骤 {skillWizardStep + 1} / {steps.length}
            </span>
            {skillWizardStep < steps.length - 1 ? (
              <Button
                onClick={() => setSkillWizardStep(skillWizardStep + 1)}
                disabled={!canGoNext() || isCreatingSkill}
                className="bg-amber-600 hover:bg-amber-700 gap-2"
              >
                {t('common.next')} →
              </Button>
            ) : (
              <Button
                onClick={handleCreateSkill}
                disabled={!canGoNext() || isCreatingSkill}
                className="bg-green-600 hover:bg-green-700 gap-2"
              >
                <Wand2 className="w-4 h-4" />
                {isCreatingSkill ? t('common.loading') : '创建 Skill'}
              </Button>
            )}
          </div>
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
        // Skip empty arrays to avoid parsing issues
        if (value.length > 0) {
          lines.push(`${key}:`);
          value.forEach((item) => {
            if (typeof item === 'object' && item !== null) {
              lines.push(`  - ${JSON.stringify(item)}`);
            } else {
              lines.push(`  - ${item}`);
            }
          });
        }
      } else if (typeof value === 'boolean') {
        lines.push(`${key}: ${value}`);
      } else if (value === null || value === undefined) {
        lines.push(`${key}: null`);
      } else if (typeof value === 'object' && value !== null) {
        lines.push(`${key}: ${JSON.stringify(value)}`);
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
