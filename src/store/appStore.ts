// ==================== Global Application State (Zustand) ====================

import { create } from 'zustand';
import type { AppData } from '../types';
import { api } from '../lib/api';

interface AppStore {
  // State
  data: AppData | null;
  isLoading: boolean;
  error: string | null;
  lastRefresh: Date | null;
  selectedTab: string;

  // UI State
  ui: {
    selectedSkill: string | null;
    selectedProject: string | null;
    selectedConfigFile: string | null;
    searchQuery: string;
    filterStatus: 'all' | 'enabled' | 'disabled';
    editorContent: string;
    isDirty: boolean;
  };

  // Actions
  loadData: () => Promise<void>;
  refreshData: () => Promise<void>;
  setError: (error: string | null) => void;
  setSelectedTab: (tab: string) => void;
  clearError: () => void;
  toggleSkill: (skillId: string, enabled: boolean) => Promise<void>;
  scanProjects: (searchPath?: string) => Promise<void>;
  testMcpConnection: (serverId: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: 'all' | 'enabled' | 'disabled') => void;
  setSelectedSkill: (skillId: string | null) => void;
  setSelectedProject: (projectId: string | null) => void;
  setSelectedConfigFile: (filePath: string | null) => void;
  setEditorContent: (content: string) => void;
  setIsDirty: (dirty: boolean) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  data: null,
  isLoading: false,
  error: null,
  lastRefresh: null,
  selectedTab: 'dashboard',

  // UI State initial values
  ui: {
    selectedSkill: null,
    selectedProject: null,
    selectedConfigFile: null,
    searchQuery: '',
    filterStatus: 'all',
    editorContent: '',
    isDirty: false,
  },

  // Actions
  loadData: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.loadAllData();
      set({
        data,
        isLoading: false,
        lastRefresh: new Date(),
      });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
    }
  },

  refreshData: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.refreshData();
      set({
        data,
        isLoading: false,
        lastRefresh: new Date(),
      });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
    }
  },

  setError: (error) => set({ error }),
  setSelectedTab: (tab) => set({ selectedTab: tab }),
  clearError: () => set({ error: null }),

  // UI State setters
  setSearchQuery: (query) => set((state) => ({ ui: { ...state.ui, searchQuery: query } })),
  setFilterStatus: (status) => set((state) => ({ ui: { ...state.ui, filterStatus: status } })),
  setSelectedSkill: (skillId) => set((state) => ({ ui: { ...state.ui, selectedSkill: skillId } })),
  setSelectedProject: (projectId) => set((state) => ({ ui: { ...state.ui, selectedProject: projectId } })),
  setSelectedConfigFile: (filePath) => set((state) => ({ ui: { ...state.ui, selectedConfigFile: filePath } })),
  setEditorContent: (content) => set((state) => ({ ui: { ...state.ui, editorContent: content } })),
  setIsDirty: (dirty) => set((state) => ({ ui: { ...state.ui, isDirty: dirty } })),

  // Skill Management Actions
  toggleSkill: async (skillId, enabled) => {
    set({ isLoading: true, error: null });
    try {
      await api.toggleSkill(skillId, enabled);

      // Update local state
      const { data } = get();
      if (data?.skills) {
        const updatedSkills = data.skills.map(skill =>
          skill.id === skillId ? { ...skill, enabled } : skill
        );
        set({ data: { ...data, skills: updatedSkills }, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
    }
  },

  // Project Management Actions
  scanProjects: async (searchPath) => {
    set({ isLoading: true, error: null });
    try {
      const projects = await api.scanProjects(searchPath);

      const { data } = get();
      if (data) {
        set({
          data: { ...data, projects },
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
    }
  },

  // MCP Server Actions
  testMcpConnection: async (serverId) => {
    const { data } = get();
    if (!data?.mcpServers) return;

    try {
      const server = data.mcpServers.find(s => s.id === serverId);
      if (!server) return;

      // Update server to testing state
      const updatedServers = data.mcpServers.map(s =>
        s.id === serverId
          ? { ...s, health: { status: 'unknown' as const, lastCheck: new Date() } }
          : s
      );
      set({ data: { ...data, mcpServers: updatedServers } });

      // Test connection
      const health = await api.testMcpConnection(server);

      // Update with result
      const finalServers = updatedServers.map(s =>
        s.id === serverId ? { ...s, health } : s
      );
      set({ data: { ...data, mcpServers: finalServers } });
    } catch (error) {
      set({
        error: (error as Error).message,
      });
    }
  },
}));
