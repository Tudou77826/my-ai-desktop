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

  // Actions
  loadData: () => Promise<void>;
  refreshData: () => Promise<void>;
  setError: (error: string | null) => void;
  setSelectedTab: (tab: string) => void;
  clearError: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  // Initial state
  data: null,
  isLoading: false,
  error: null,
  lastRefresh: null,
  selectedTab: 'dashboard',

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
}));
