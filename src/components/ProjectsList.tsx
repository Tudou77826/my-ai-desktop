// ==================== ProjectsList Component ====================

import { useEffect, useState, useMemo } from 'react';
import { Folder, Search, RefreshCw, Plus, HardDrive, Download } from 'lucide-react';
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
  const [lastScanResult, setLastScanResult] = useState<{ count: number; scannedPaths: string[]; projects: any[] } | null>(null);
  const [importing, setImporting] = useState(false);

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
    try {
      const searchPath = pathsToScan.join(',');
      const result: any = await api.scanProjects(searchPath);

      // Handle new response format
      if (result && typeof result === 'object' && 'projects' in result) {
        setLastScanResult({
          count: result.count || result.projects?.length || 0,
          scannedPaths: result.scannedPaths || [],
          projects: result.projects || []
        });
        showToast(`Found ${result.count || 0} projects in ${result.scannedPaths?.length || 0} paths`, 'success');
      } else {
        // Legacy format (array of projects)
        const projects = Array.isArray(result) ? result : [];
        setLastScanResult({
          count: projects.length,
          scannedPaths: pathsToScan,
          projects
        });
        showToast(`Found ${projects.length} projects`, 'success');
      }

      // Reload data
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

  const handleImportAll = async () => {
    if (!lastScanResult?.projects || lastScanResult.projects.length === 0) {
      showToast('No scan results to import', 'error');
      return;
    }

    setImporting(true);
    try {
      const result = await api.importProjects(lastScanResult.projects);

      showToast(`Imported ${result.added} projects (${result.skipped} skipped)`, 'success');

      // Clear scan results after import
      setLastScanResult(null);

      // Reload data
      await loadData();
    } catch (error) {
      showToast(`Failed to import projects: ${(error as Error).message}`, 'error');
    } finally {
      setImporting(false);
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

  const toggleScanPath = (path: string) => {
    setSelectedScanPaths(prev =>
      prev.includes(path)
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Projects</h1>
        <p className="text-gray-600">Manage your ClaudeCode projects</p>
        {lastScanResult && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">
                Found {lastScanResult.count} projects
              </p>
              <p className="text-xs text-blue-700">
                Scanned {lastScanResult.scannedPaths.length} paths
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleImportAll}
              disabled={importing}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {importing ? 'Importing...' : 'Import All'}
            </Button>
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
              : 'Select scan paths above and click "Scan" to discover projects, then click "Import All" to add them.'}
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
