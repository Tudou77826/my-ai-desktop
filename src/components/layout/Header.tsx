// ==================== Header Component ====================

import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { Button } from '../ui/Button';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { formatRelativeTime } from '../../lib/utils';

export function Header() {
  const { isLoading, lastRefresh, refreshData } = useAppStore();

  return (
    <header className="h-14 fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 z-50">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left: Logo and title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">ClaudeCode Config Manager</h1>
            <p className="text-xs text-gray-500">可视化配置管理工具</p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Last refresh time */}
          {lastRefresh && (
            <span className="text-xs text-gray-500 hidden sm:block">
              最后更新: {formatRelativeTime(lastRefresh)}
            </span>
          )}

          {/* Refresh button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={refreshData}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>
    </header>
  );
}
