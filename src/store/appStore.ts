// ==================== Global Application State (Zustand) ====================

import { create } from 'zustand';
import type { AppData } from '../types';
import { api } from '../lib/api';
import type { MCPTool, MCPResource, HealthCheckPoint, SkillTemplate, SkillTestResult } from '../lib/api';

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

  // Iteration 3: MCP State
  mcpTools: Map<string, MCPTool[]>;
  mcpResources: Map<string, MCPResource[]>;
  mcpHealthHistory: Map<string, HealthCheckPoint[]>;

  // Iteration 3: Skills State
  skillTemplates: SkillTemplate[];
  isCreatingSkill: boolean;
  skillWizardStep: number;

  // Iteration 3: Language
  language: 'zh-CN' | 'en-US';

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

  // Iteration 3: MCP Actions
  loadMcpTools: (serverId: string) => Promise<void>;
  loadMcpResources: (serverId: string) => Promise<void>;
  testMcpTool: (serverId: string, toolName: string, args: any) => Promise<any>;
  getMcpHealthHistory: (serverId: string) => Promise<void>;

  // Iteration 3: Skill Actions
  loadSkillTemplates: () => Promise<void>;
  createSkill: (scope: 'global' | 'project', skill: any, projectPath?: string) => Promise<void>;
  validateSkillFrontmatter: (frontmatter: any) => Promise<any>;
  testSkill: (skillId: string, arguments_?: string[]) => Promise<SkillTestResult>;

  // Iteration 3: Language Action
  setLanguage: (language: 'zh-CN' | 'en-US') => void;
  setSkillWizardStep: (step: number) => void;
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

  // Iteration 3: Initial state
  mcpTools: new Map(),
  mcpResources: new Map(),
  mcpHealthHistory: new Map(),
  skillTemplates: [],
  isCreatingSkill: false,
  skillWizardStep: 0,
  language: 'zh-CN',

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

  // ==================== Iteration 3: MCP Actions ====================

  loadMcpTools: async (serverId) => {
    try {
      const tools = await api.getMcpTools(serverId);
      set((state) => {
        const newMap = new Map(state.mcpTools);
        newMap.set(serverId, tools);
        return { mcpTools: newMap };
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  loadMcpResources: async (serverId) => {
    try {
      const resources = await api.getMcpResources(serverId);
      set((state) => {
        const newMap = new Map(state.mcpResources);
        newMap.set(serverId, resources);
        return { mcpResources: newMap };
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  testMcpTool: async (serverId, toolName, args) => {
    try {
      return await api.testMcpTool(serverId, toolName, args);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  getMcpHealthHistory: async (serverId) => {
    try {
      const history = await api.getMcpHealthHistory(serverId);
      set((state) => {
        const newMap = new Map(state.mcpHealthHistory);
        newMap.set(serverId, history);
        return { mcpHealthHistory: newMap };
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // ==================== Iteration 3: Skill Actions ====================

  loadSkillTemplates: async () => {
    try {
      const templates = await api.getSkillTemplates();
      set({ skillTemplates: templates });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  createSkill: async (scope, skill, projectPath) => {
    set({ isCreatingSkill: true, error: null });
    try {
      await api.createSkill(scope, skill, projectPath);
      set({ isCreatingSkill: false, skillWizardStep: 0 });

      // Reload data to get the new skill
      await get().loadData();
    } catch (error) {
      set({
        error: (error as Error).message,
        isCreatingSkill: false,
      });
      throw error;
    }
  },

  validateSkillFrontmatter: async (frontmatter) => {
    try {
      return await api.validateSkillFrontmatter(frontmatter);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  testSkill: async (skillId, arguments_) => {
    try {
      return await api.testSkill(skillId, arguments_);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // ==================== Iteration 3: Language Actions ====================

  setLanguage: (language) => {
    set({ language });
    localStorage.setItem('language', language);
  },

  setSkillWizardStep: (step) => set({ skillWizardStep: step }),
}));
