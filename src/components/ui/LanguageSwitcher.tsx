// ==================== Language Switcher Component ====================

import { useAppStore } from '../../store/appStore';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { language, setLanguage } = useAppStore();

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-gray-600" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as 'zh-CN' | 'en-US')}
        className="text-sm border border-gray-300 rounded px-2 py-1 bg-white hover:bg-gray-50 cursor-pointer"
      >
        <option value="zh-CN">中文</option>
        <option value="en-US">English</option>
      </select>
    </div>
  );
}
