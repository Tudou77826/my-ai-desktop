// ==================== Main App Component ====================

import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './components/Dashboard';
import { useAppStore } from './store/appStore';

function App() {
  const { selectedTab } = useAppStore();

  // Render content based on selected tab
  const renderContent = () => {
    switch (selectedTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'skills':
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Skills 管理页面 - 开发中...</p>
          </div>
        );
      case 'mcp':
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">MCP 服务器页面 - 开发中...</p>
          </div>
        );
      case 'projects':
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">项目管理页面 - 开发中...</p>
          </div>
        );
      case 'config':
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">配置编辑器页面 - 开发中...</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 ml-60 mt-14 overflow-auto">
          <div className="p-6">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
}

export default App;
