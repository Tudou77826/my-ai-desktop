// ==================== Neutralino Backend Entry Point ====================
// This file registers the backend API with Neutralino's IPC

// Import the API from the compiled background script
// Note: In production, this will be compiled from src/background/index.ts

// For development, we'll use a simple mock that will be replaced during build

const api = {
  async loadAllData() {
    // This is a placeholder - the real implementation is in src/background/index.ts
    console.log('loadAllData called');
    return {
      skills: [],
      mcpServers: [],
      projects: [],
      configFiles: [],
    };
  },
};

// Register API functions with Neutralino
// @ts-ignore
if (typeof Neutralino !== 'undefined') {
  // @ts-ignore
  Neutralino.ipc.setData('loadAllData', api.loadAllData);
  // @ts-ignore
  Neutralino.ipc.setData('refreshData', api.loadAllData);
}
