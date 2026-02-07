// ==================== Dashboard Component ====================

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Plug, FolderKanban, FileText, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Loading } from './ui/Loading';

export function Dashboard() {
  const { t } = useTranslation();
  const { data, isLoading, error, loadData } = useAppStore();

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{t('common.error')}</h3>
                <p className="text-sm text-gray-600">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    {
      label: t('dashboard.stats.totalSkills'),
      value: data?.skills.length || 0,
      icon: Box,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      label: t('dashboard.stats.totalMcpServers'),
      value: data?.mcpServers.length || 0,
      icon: Plug,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: t('dashboard.stats.totalProjects'),
      value: data?.projects.length || 0,
      icon: FolderKanban,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: t('dashboard.stats.totalConfigFiles'),
      value: data?.configFiles.length || 0,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h2>
        <p className="text-sm text-gray-600 mt-1">{t('dashboard.overview')}</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-11 h-11 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Health status */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.healthStatus.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-gray-700">{t('dashboard.healthStatus.normal')}</span>
            </div>
            {data && data.skills.length > 0 && (
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-gray-700">
                  {t('dashboard.healthStatus.skillsLoaded', { count: data.skills.length })}
                </span>
              </div>
            )}
            {data && data.mcpServers.length > 0 && (
              <div className="flex items-center gap-3 text-sm">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <span className="text-gray-700">
                  {t('dashboard.healthStatus.mcpServersConfigured', { count: data.mcpServers.length })}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick info */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.quickStart.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>{t('dashboard.quickStart.tip1')}</p>
            <p>{t('dashboard.quickStart.tip2')}</p>
            <p>{t('dashboard.quickStart.tip3')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
