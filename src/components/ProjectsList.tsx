// ==================== ProjectsList Component ====================

import { useEffect, useState, useMemo } from 'react';
import { Folder, Search, RefreshCw, Plus, HardDrive, Trash2, X } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useToast } from './ui/Toast';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { ProjectCard } from './ProjectCard';
import { ProjectDetailDialog } from './ProjectDetailDialog';
import { Dialog } from './ui/Dialog';
import { api } from '../lib/api';

// Common scan paths for Windows
const COMMON_SCAN_PATHS = [
  { label: 'Home', path: '~' },
  { label: 'D:\\', path: 'D:\\' },
  { label: 'D:\\dev', path: 'D:\\dev' },
  { label: 'D:\\projects', path: 'D:\\projects' },
  { label: 'C:\\dev', path: 'C:\\dev' },
  { label: 'C:\\projects', path: 'C:\\projects' },
];

export function ProjectsList() {
  const { data, isLoading, ui, setSearchQuery, loadData } = useAppStore();
  const { showToast } = useToast();
  const [selectedScanPaths, setSelectedScanPaths] = useState<string[]>(['~']);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectDetail, setSelectedProjectDetail] = useState<any>(null);
  const [debouncedQuery, setDebouncedQuery] = useState(ui.searchQuery);
  const [scanning, setScanning] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newProjectPath, setNewProjectPath] = useState('');
  const [addingProject, setAddingProject] = useState(false);
  const [scanSummary, setScanSummary] = useState<{ found: number; imported: number } | null>(null);

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

  const handleScan = async (paths?: string[]) => {
    const pathsToScan = paths || selectedScanPaths;
    if (pathsToScan.length === 0) {
      showToast('Please select at least one path to scan', 'error');
      return;
    }

    setScanning(true);
    setScanSummary(null);
    try {
      const searchPath = pathsToScan.join(',');
      const result: any = await api.scanProjects(searchPath);

      // Handle new response format
      if (result && typeof result === 'object' && 'projects' in result) {
        const found = result.count || result.projects?.length || 0;
        const imported = result.imported || 0;
        setScanSummary({ found, imported });

        if (imported > 0) {
          showToast(`Scanned and imported ${imported} new projects (found ${found} total)`, 'success');
        } else {
          showToast(`Found ${found} projects (all already in list)`, 'success');
        }
      } else {
        // Legacy format (array of projects)
        const projects = Array.isArray(result) ? result : [];
        setScanSummary({ found: projects.length, imported: 0 });
        showToast(`Found ${projects.length} projects`, 'success');
      }

      // Reload data to show updated project list
      await loadData();
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

  const handleRemoveProject = async (projectPath: string, projectName: string) => {
    if (!confirm(`Remove "${projectName}" from the project list?\n\nThis will only remove the record, not delete any files.`)) {
      return;
    }

    try {
      await api.removeProject(projectPath);
      await loadData();
      showToast(`Project "${projectName}" removed from list`, 'success');
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to remove project';
      showToast(errorMsg, 'error');
    }
  };

  const toggleScanPath = (path: string) => {
    setSelectedScanPaths(prev =>
      prev.includes(path)
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  const dismissScanSummary = () => {
    setScanSummary(null);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Projects</h1>
        <p className="text-gray-600">Manage your ClaudeCode projects</p>
        {scanSummary && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900">
                Scanned and imported {scanSummary.imported} new projects
              </p>
              <p className="text-xs text-green-700">
                Found {scanSummary.found} total projects
              </p>
            </div>
            <button
              onClick={dismissScanSummary}
              className="text-green-600 hover:text-green-800 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="mb-6">
        {/* Search and Path Selection Row */}
        <div className="flex items-center gap-4 mb-4">
          {/* Search */}
          <div className="flex-1">
            <Input
              placeholder="Search projects..."
              showSearchIcon
              value={ui.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* Scan Paths Selection */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <HardDrive className="w-4 h-4" />
            Scan paths:
          </span>
          {COMMON_SCAN_PATHS.map(({ label, path }) => (
            <Button
              key={path}
              variant={selectedScanPaths.includes(path) ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => toggleScanPath(path)}
              className="text-xs"
            >
              {label}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleScan()}
            disabled={scanning || isLoading}
            className="flex items-center gap-2"
          >
            <Folder className={`w-4 h-4 ${scanning ? 'animate-pulse' : ''}`} />
            {scanning ? 'Scanning...' : `Scan (${selectedScanPaths.length})`}
          </Button>
        </div>
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
              : 'Select scan paths above and click "Scan" to discover and import projects.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <div key={project.id} className="relative">
              <button
                onClick={() => handleRemoveProject(project.path, project.name)}
                className="absolute top-2 right-2 z-10 p-1.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
                title="Remove from list"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <ProjectCard
                project={project}
                onViewDetails={handleViewDetails}
              />
            </div>
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
              <li><code>D:\dev\my-project</code></li>
              <li><code>C:\Users\YourName\Documents\project</code></li>
              <li><code>/home/user/workspace/app</code></li>
            </ul>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
