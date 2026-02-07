// ==================== Main App Component ====================

import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './components/Dashboard';
import { SkillsList } from './components/SkillsList';
import { MCPServers } from './components/MCPServers';
import { ProjectsList } from './components/ProjectsList';
import { ConfigEditor } from './components/ConfigEditor';
import { ToastProvider } from './components/ui/Toast';
import { useAppStore } from './store/appStore';

function AppContent() {
  const { selectedTab } = useAppStore();

  // Render content based on selected tab
  const renderContent = () => {
    switch (selectedTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'skills':
        return <SkillsList />;
      case 'mcp':
        return <MCPServers />;
      case 'projects':
        return <ProjectsList />;
      case 'config':
        return <div className="h-full"><ConfigEditor /></div>;
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
          {selectedTab === 'config' ? (
            renderContent()
          ) : (
            <div className="p-6">{renderContent()}</div>
          )}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
