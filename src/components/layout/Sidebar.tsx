// ==================== Sidebar Component ====================

import {
  LayoutDashboard,
  Puzzle,
  Plug,
  FolderKanban,
  FileCode,
  Bot,
  Bookmark,
  Terminal
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { cn } from '../../lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: '概览', icon: LayoutDashboard },
  { id: 'skills', label: 'Skills', icon: Puzzle },
  { id: 'mcp', label: 'MCP', icon: Plug },
  { id: 'subagents', label: 'SubAgents', icon: Bot },
  { id: 'rules', label: 'Rules', icon: Bookmark },
  { id: 'commands', label: 'Commands', icon: Terminal },
  { id: 'projects', label: '项目', icon: FolderKanban },
  { id: 'config', label: '配置', icon: FileCode },
];

export function Sidebar() {
  const { selectedTab, setSelectedTab } = useAppStore();

  return (
    <aside className="w-60 fixed left-0 top-14 bottom-0 bg-gray-50 border-r border-gray-200 overflow-y-auto">
      <nav className="p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = selectedTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setSelectedTab(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-700 hover:bg-gray-200'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500">
          <p>版本: 0.1.0</p>
          <p>技术栈: Neutralino + React</p>
        </div>
      </div>
    </aside>
  );
}
