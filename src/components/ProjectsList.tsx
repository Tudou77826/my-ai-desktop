// ==================== ProjectsList Component ====================

import { useEffect, useState, useMemo } from 'react';
import { Folder, Search, RefreshCw, Plus } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useToast } from './ui/Toast';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { ProjectCard } from './ProjectCard';
import { ProjectDetailDialog } from './ProjectDetailDialog';
import { Dialog } from './ui/Dialog';
import { api } from '../lib/api';

export function ProjectsList() {
  const { data, isLoading, ui, setSearchQuery, loadData } = useAppStore();
  const { showToast } = useToast();
  const [searchPath, setSearchPath] = useState('~');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectDetail, setSelectedProjectDetail] = useState<any>(null);
  const [debouncedQuery, setDebouncedQuery] = useState(ui.searchQuery);
  const [scanning, setScanning] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newProjectPath, setNewProjectPath] = useState('');
  const [addingProject, setAddingProject] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(ui.searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [ui.searchQuery]);

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!data?.projects) return [];

    let projects = [...data.projects];

    // Filter by search query
    if (debouncedQuery) {
      const query = debouncedQuery.toLowerCase();
      projects = projects.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.path.toLowerCase().includes(query)
      );
    }

    return projects;
  }, [data?.projects, debouncedQuery]);

  const handleScan = async () => {
    setScanning(true);
    try {
      await api.scanProjects(searchPath);
      // Reload data
      await loadData();
      showToast(`Projects scanned from ${searchPath}`, 'success');
    } catch (error) {
      showToast(`Failed to scan projects: ${(error as Error).message}`, 'error');
    } finally {
      setScanning(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await loadData();
      showToast('Projects refreshed', 'success');
    } catch (error) {
      showToast(`Failed to refresh: ${(error as Error).message}`, 'error');
    }
  };

  const handleViewDetails = async (projectId: string) => {
    setSelectedProjectId(projectId);
    try {
      const detail = await api.getProjectDetail(projectId);
      setSelectedProjectDetail({
        name: projectId.split(/[/\\]/).pop() || projectId,
        path: projectId,
        ...detail,
      });
    } catch (error) {
      showToast(`Failed to load project details: ${(error as Error).message}`, 'error');
    }
  };

  const handleAddProject = async () => {
    if (!newProjectPath.trim()) {
      showToast('Please enter a project path', 'error');
      return;
    }

    setAddingProject(true);
    try {
      const project = await api.addProject(newProjectPath);

      // Reload all data from server to ensure UI updates
      await loadData();

      showToast(`Project "${project.name}" added successfully`, 'success');
      setShowAddDialog(false);
      setNewProjectPath('');
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to add project';
      showToast(errorMsg, 'error');
    } finally {
      setAddingProject(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Projects</h1>
        <p className="text-gray-600">Manage your ClaudeCode projects</p>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center gap-4 mb-6">
        {/* Search */}
        <div className="flex-1">
          <Input
            placeholder="Search projects..."
            showSearchIcon
            value={ui.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Scan Path Input */}
        <div className="w-48">
          <Input
            placeholder="Scan path (e.g., ~)"
            value={searchPath}
            onChange={(e) => setSearchPath(e.target.value)}
          />
        </div>

        {/* Add Project Button */}
        <Button
          variant="primary"
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Project
        </Button>

        {/* Scan Button */}
        <Button
          variant="outline"
          onClick={handleScan}
          disabled={scanning || isLoading}
          className="flex items-center gap-2"
        >
          <Folder className={`w-4 h-4 ${scanning ? 'animate-pulse' : ''}`} />
          {scanning ? 'Scanning...' : 'Scan'}
        </Button>

        {/* Refresh Button */}
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Folder className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500">
            {debouncedQuery
              ? 'No projects match your search'
              : 'No projects found'}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            {debouncedQuery
              ? 'Try a different search term'
              : 'Projects are automatically scanned. Click "Add Project" to manually add a project path.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <ProjectDetailDialog
        open={selectedProjectId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProjectId(null);
            setSelectedProjectDetail(null);
          }
        }}
        project={selectedProjectDetail}
      />

      {/* Add Project Dialog */}
      <Dialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        title="Add Project"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddProject}
              disabled={addingProject || !newProjectPath.trim()}
            >
              {addingProject ? 'Adding...' : 'Add Project'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Enter the path to a ClaudeCode project (directory containing <code>.claude/</code> or <code>CLAUDE.md</code>)
          </p>

          <Input
            placeholder="Project path (e.g., ~/projects/my-app)"
            value={newProjectPath}
            onChange={(e) => setNewProjectPath(e.target.value)}
          />

          <div className="text-xs text-gray-500 space-y-1">
            <p>Examples:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><code>~/projects/my-app</code></li>
              <li><code>C:\Users\YourName\Documents\project</code></li>
              <li><code>/home/user/workspace/app</code></li>
            </ul>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
