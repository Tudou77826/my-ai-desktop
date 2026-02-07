// ==================== ConfigEditor Component ====================

import { useState, useEffect, useMemo } from 'react';
import { Save, RefreshCw, FileText, Globe, Folder } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useToast } from './ui/Toast';
import { Button } from './ui/Button';
import { FileTree, TreeNode } from './FileTree';
import { MonacoEditor } from './MonacoEditor';
import { SavePreviewDialog } from './SavePreviewDialog';
import { api } from '../lib/api';
import { Badge } from './ui/Badge';

export function ConfigEditor() {
  const { data } = useAppStore();
  const { showToast } = useToast();

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [diff, setDiff] = useState('');
  const [saving, setSaving] = useState(false);

  // Separate config files by scope
  const { globalConfigs, projectConfigs } = useMemo(() => {
    if (!data?.configFiles) {
      return { globalConfigs: [], projectConfigs: [] };
    }

    const global: any[] = [];
    const project: any[] = [];

    data.configFiles.forEach((file) => {
      if (file.scope === 'global') {
        global.push(file);
      } else {
        project.push(file);
      }
    });

    return { globalConfigs: global, projectConfigs: project };
  }, [data?.configFiles]);

  // Build file tree nodes from configs
  const buildFileTree = (configs: any[], scopeLabel: string): TreeNode[] => {
    if (configs.length === 0) return [];

    return configs.map((file) => {
      const fileName = file.path.split(/[/\\]/).pop() || file.path;
      return {
        name: fileName,
        path: file.path,
        type: 'file',
      };
    });
  };

  const globalTree = useMemo(() => buildFileTree(globalConfigs, 'Global'), [globalConfigs]);
  const projectTree = useMemo(() => buildFileTree(projectConfigs, 'Project'), [projectConfigs]);

  // Combine all file trees with category headers
  const fileTree = useMemo((): TreeNode[] => {
    const nodes: TreeNode[] = [];

    // Add Global Configs section
    if (globalTree.length > 0) {
      nodes.push({
        name: '🌐 Global Configs',
        path: '__global__',
        type: 'directory',
        children: globalTree,
      });
    }

    // Add Project Configs section
    if (projectTree.length > 0) {
      nodes.push({
        name: '📁 Project Configs',
        path: '__project__',
        type: 'directory',
        children: projectTree,
      });
    }

    return nodes;
  }, [globalTree, projectTree]);

  // Get file scope and badge info
  const getFileInfo = (filePath: string) => {
    const config = data?.configFiles.find((f: any) => f.path === filePath);
    if (!config) return null;

    return {
      scope: config.scope,
      scopeLabel: config.scope === 'global' ? 'Global' : 'Project',
      type: config.type,
    };
  };

  // Load file content when selected
  useEffect(() => {
    if (!selectedFile || selectedFile.startsWith('__')) {
      setEditorContent('');
      setOriginalContent('');
      setIsDirty(false);
      return;
    }

    const loadFile = async () => {
      try {
        const config = await api.readConfig(selectedFile);
        const content = config.raw || JSON.stringify(config.content, null, 2);
        setEditorContent(content);
        setOriginalContent(content);
        setIsDirty(false);
      } catch (error) {
        showToast(`Failed to load file: ${(error as Error).message}`, 'error');
      }
    };

    loadFile();
  }, [selectedFile]);

  // Handle editor content change
  const handleEditorChange = (value: string | undefined) => {
    const newContent = value || '';
    setEditorContent(newContent);
    setIsDirty(newContent !== originalContent);
  };

  // Handle save
  const handleSave = async () => {
    if (!selectedFile) return;

    // Validate JSON if needed
    if (selectedFile.endsWith('.json')) {
      try {
        JSON.parse(editorContent);
      } catch (error) {
        showToast(`Invalid JSON: ${(error as Error).message}`, 'error');
        return;
      }
    }

    // Generate diff preview
    try {
      const diffPreview = await api.previewChanges(selectedFile, editorContent);
      setDiff(diffPreview);
      setShowSaveDialog(true);
    } catch (error) {
      showToast(`Failed to generate preview: ${(error as Error).message}`, 'error');
    }
  };

  // Confirm save
  const handleConfirmSave = async () => {
    if (!selectedFile) return;

    setSaving(true);
    try {
      await api.writeConfig(selectedFile, editorContent, true);
      setOriginalContent(editorContent);
      setIsDirty(false);
      showToast('File saved successfully', 'success');

      // Reload data
      const { loadData } = useAppStore.getState();
      await loadData();
    } catch (error) {
      showToast(`Failed to save file: ${(error as Error).message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    const { loadData } = useAppStore.getState();
    try {
      await loadData();
      showToast('Config files refreshed', 'success');
    } catch (error) {
      showToast(`Failed to refresh: ${(error as Error).message}`, 'error');
    }
  };

  // Get file language
  const getLanguage = (path: string | null): 'json' | 'markdown' => {
    if (!path) return 'json';
    if (path.endsWith('.json')) return 'json';
    if (path.endsWith('.md')) return 'markdown';
    return 'json';
  };

  const fileInfo = selectedFile ? getFileInfo(selectedFile) : null;

  return (
    <div className="flex h-full">
      {/* Sidebar - File Tree */}
      <div className="w-72 border-r border-gray-200 bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Configuration Files
          </h2>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" />
              <span>{globalConfigs.length} Global</span>
            </div>
            <div className="flex items-center gap-1">
              <Folder className="w-3.5 h-3.5" />
              <span>{projectConfigs.length} Project</span>
            </div>
          </div>
        </div>

        {/* Tree */}
        <div className="flex-1 overflow-auto p-4">
          {fileTree.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              <FileText className="w-10 h-10 mx-auto mb-2 text-gray-400" />
              <p>No configuration files found</p>
            </div>
          ) : (
            <FileTree
              nodes={fileTree}
              selectedPath={selectedFile}
              onSelect={setSelectedFile}
            />
          )}
        </div>
      </div>

      {/* Main Content - Editor */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          {/* File Path & Scope */}
          <div className="flex-1">
            {selectedFile && fileInfo ? (
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xs text-gray-500">File</p>
                  <p className="text-sm text-gray-900 font-medium truncate" title={selectedFile}>
                    {selectedFile.split(/[/\\]/).pop()}
                  </p>
                </div>
                <Badge variant={fileInfo.scope === 'global' ? 'default' : 'neutral'} className="flex items-center gap-1">
                  {fileInfo.scope === 'global' ? (
                    <><Globe className="w-3 h-3" /> {fileInfo.scopeLabel}</>
                  ) : (
                    <><Folder className="w-3 h-3" /> {fileInfo.scopeLabel}</>
                  )}
                </Badge>
                <p className="text-xs text-gray-500 truncate max-w-md" title={selectedFile}>
                  {selectedFile}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Select a file to edit</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2"
              size="sm"
              onClick={handleSave}
              disabled={!selectedFile || !isDirty || saving}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 bg-white">
          {selectedFile && !selectedFile.startsWith('__') ? (
            <MonacoEditor
              value={editorContent}
              onChange={handleEditorChange}
              language={getLanguage(selectedFile)}
              height="100%"
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 text-lg mb-2">No file selected</p>
                <p className="text-gray-400 text-sm">
                  Select a configuration file from the sidebar to edit
                </p>
                {fileTree.length === 0 && (
                  <p className="text-gray-400 text-xs mt-4">
                    Configuration files are automatically loaded from global and project directories
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Preview Dialog */}
      <SavePreviewDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        filePath={selectedFile || ''}
        diff={diff}
        onConfirm={handleConfirmSave}
      />
    </div>
  );
}
