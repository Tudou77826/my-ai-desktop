// ==================== Chinese (Simplified) Translations ====================

export default {
  // Common
  common: {
    loading: '加载中...',
    error: '错误',
    success: '成功',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    create: '创建',
    search: '搜索',
    refresh: '刷新',
    confirm: '确认',
    close: '关闭',
    back: '返回',
    next: '下一步',
    previous: '上一步',
    finish: '完成',
  },

  // Navigation
  nav: {
    dashboard: '概览',
    skills: 'Skills',
    mcp: 'MCP',
    projects: '项目',
    config: '配置',
  },

  // Dashboard
  dashboard: {
    title: '配置概览',
    overview: '管理您的 ClaudeCode 配置',
    stats: {
      totalSkills: 'Skills',
      enabledSkills: '已启用 Skills',
      totalMcpServers: 'MCP 服务器',
      enabledMcpServers: '已启用 MCP 服务器',
      totalProjects: '项目',
      totalConfigFiles: '配置文件',
    },
    healthStatus: {
      title: '配置健康状态',
      normal: '应用运行正常',
      skillsLoaded: '已加载 {{count}} 个 Skills',
      mcpServersConfigured: '已配置 {{count}} 个 MCP 服务器',
    },
    quickStart: {
      title: '快速开始',
      tip1: '• 使用左侧导航栏切换不同功能',
      tip2: '• 点击"刷新"按钮重新加载配置',
      tip3: '• 所有修改都会自动创建备份',
    },
  },

  // Skills
  skills: {
    title: 'Skills 管理',
    createSkill: '创建 Skill',
    skillTemplates: 'Skill 模板',
    wizard: {
      step1: '基本信息',
      step2: 'Frontmatter 配置',
      step3: '内容编辑',
      skillId: 'Skill ID',
      displayName: '显示名称',
      description: '描述',
      author: '作者',
      selectTemplate: '选择模板',
      frontmatterHelp: 'Frontmatter 是 Skill 的配置元数据，使用 YAML 格式。',
      validate: '验证',
      writeContent: '编写 Skill 内容',
    },
    test: {
      title: '测试 Skill',
      arguments: '参数（用空格分隔）',
      runTest: '运行测试',
      testResult: '测试结果',
    },
  },

  // MCP
  mcp: {
    title: 'MCP 服务器',
    tools: '工具',
    resources: '资源',
    connectionTest: '连接测试',
    testTool: '测试工具',
    toolBrowser: '工具浏览器',
    latency: '延迟',
    status: '状态',
    lastCheck: '最后检查',
    toolsCount: '工具数',
    resourcesCount: '资源数',
    testConnection: '测试连接',
    healthHistory: '健康历史',
    permission: {
      allowed: '允许',
      blocked: '阻止',
      default: '默认',
    },
  },

  // Projects
  projects: {
    title: '项目管理',
    addProject: '添加项目',
    scanProjects: '扫描项目',
    projectPath: '项目路径',
  },

  // Config
  config: {
    title: '配置编辑器',
    fileTree: '文件树',
    editor: '编辑器',
    preview: '预览',
  },

  // Language
  language: {
    title: '语言',
    'zh-CN': '中文',
    'en-US': 'English',
  },
};
