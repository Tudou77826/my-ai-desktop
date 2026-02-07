// ==================== ProjectDetailDialog Component ====================

import { Dialog } from './ui/Dialog';
import { BookOpen, Package, Zap } from 'lucide-react';

interface ProjectDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    name: string;
    path: string;
    config?: any;
    claudeMd?: {
      path: string;
      content: string;
    };
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

export function ProjectDetailDialog({ open, onOpenChange, project }: ProjectDetailDialogProps) {
  if (!project) return null;

  const hasConfig = project.config && Object.keys(project.config).length > 0;
  const hasClaudeMd = project.claudeMd && project.claudeMd.content.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={project.name} className="max-w-5xl">
      <div className="space-y-6">
        {/* Path */}
        <div className="flex items-start gap-2 pb-4 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-1">Project Path</p>
            <p className="text-sm text-gray-700 font-mono break-all bg-gray-50 px-3 py-2 rounded-md">
              {project.path}
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Config Info */}
          {hasConfig && (
            <div className="bg-white">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Package className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Configuration</h3>
                  <p className="text-xs text-gray-500">.claude/config.json</p>
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
                <pre className="text-sm text-gray-100 font-mono">
                  {JSON.stringify(project.config, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* CLAUDE.md */}
          {hasClaudeMd ? (
            <div className={`${hasConfig ? '' : 'lg:col-span-2'} bg-white`}>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Project Instructions</h3>
                  <p className="text-xs text-gray-500">CLAUDE.md</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-5 overflow-auto max-h-96">
                <div className="prose prose-sm max-w-none text-gray-700">
                  <div dangerouslySetInnerHTML={renderMarkdown(project.claudeMd?.content ?? '')} />
                </div>
              </div>
            </div>
          ) : (
            <div className={`lg:col-span-2 text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200`}>
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 font-medium">No CLAUDE.md content available</p>
              <p className="text-sm text-gray-400 mt-1">Add a CLAUDE.md file to this project to provide context</p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
          {hasConfig && (
            <div className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Config Available</span>
            </div>
          )}
          {hasClaudeMd && (
            <div className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Documentation Available</span>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
