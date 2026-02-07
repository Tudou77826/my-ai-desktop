// ==================== SkillDetailDialog Component ====================

import { Dialog } from './ui/Dialog';
import { BookOpen } from 'lucide-react';

interface SkillDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill: {
    id: string;
    metadata?: {
      name?: string;
      description?: string;
    };
    content?: string;
  } | null;
}

/**
 * Simple Markdown renderer (no external library)
 */
function renderMarkdown(content: string): { __html: string } {
  let html = content;

  // Escape HTML tags first
  html = html.replace(/&/g, '&amp;');
  html = html.replace(/</g, '&lt;');
  html = html.replace(/>/g, '&gt;');

  // Headers
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mb-4 mt-6">$1</h1>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mb-3 mt-5">$1</h2>');
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-medium mb-2 mt-4">$1</h3>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Inline code
  html = html.replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800">$1</code>');

  // Code blocks
  html = html.replace(/```(\w+)?\n([\s\S]+?)```/g, (_match, _lang, code) => {
    return `<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code class="text-sm font-mono">${code.trim()}</code></pre>`;
  });

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-amber-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

  // Line breaks
  html = html.replace(/\n\n/g, '</p><p class="mb-3">');
  html = html.replace(/\n/g, '<br/>');

  return { __html: `<p class="mb-3">${html}</p>` };
}

export function SkillDetailDialog({ open, onOpenChange, skill }: SkillDetailDialogProps) {
  if (!skill) return null;

  const name = skill.metadata?.name || skill.id;
  const description = skill.metadata?.description;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={name} className="max-w-4xl">
      {/* Skill Info Header */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Skill ID</p>
            <p className="text-sm font-mono text-gray-900">{skill.id}</p>
          </div>
        </div>
        {description && (
          <p className="text-gray-600 italic">"{description}"</p>
        )}
      </div>

      {/* Skill Content */}
      {skill.content ? (
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-headings:font-semibold prose-a:text-amber-600 prose-a:no-underline hover:prose-a:underline">
            <div dangerouslySetInnerHTML={renderMarkdown(skill.content)} />
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <BookOpen className="w-20 h-20 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 font-medium text-lg mb-1">No SKILL.md content available</p>
          <p className="text-sm text-gray-400">This skill doesn't have a documentation file</p>
        </div>
      )}
    </Dialog>
  );
}
