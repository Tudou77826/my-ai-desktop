# ClaudeCode Config Manager - 迭代 3-6 规划

> 基于 ClaudeCode 官方文档分析的详细迭代计划
> 创建日期：2026-02-07

## 📊 功能差距分析

基于 ClaudeCode 官方文档，当前软件与完整功能相比存在以下差距：

### 1. **MCP 管理功能缺失**
   - ❌ MCP 连接测试
   - ❌ 工具浏览器
   - ❌ 环境变量编辑器
   - ❌ 权限管理器

### 2. **Skills 高级功能缺失**
   - ❌ Skill 创建向导
   - ❌ Frontmatter 编辑器
   - ❌ 动态上下文注入（!command 语法）
   - ❌ Skill 测试面板

### 3. **Memory 管理完全缺失**
   - ❌ CLAUDE.md 编辑器
   - ❌ 自动内存查看器
   - ❌ 规则树视图
   - ❌ 模块化规则管理

### 4. **Hooks 系统完全缺失**
   - ❌ 15+ 事件类型支持
   - ❌ Hook 创建向导
   - ❌ 测试沙箱
   - ❌ 异步 Hook 执行

### 5. **Plugin 生态系统缺失**
   - ❌ 插件市场
   - ❌ 安装向导
   - ❌ 组件查看器
   - ❌ 更新管理

---

## 🎯 迭代 3：高级 MCP & Skills 管理（优先级：高）

### 目标
增强 MCP 和 Skills 的管理能力，提供更强大的配置和测试工具。

### 后端 API 扩展

```typescript
// MCP 连接测试
interface HealthStatus {
  status: 'unknown' | 'ok' | 'error';
  latency?: number;
  lastCheck: Date;
  error?: string;
  tools?: number;
  resources?: number;
}

async testMcpConnection(serverId: string): Promise<HealthStatus>
async getMcpTools(serverId: string): Promise<Tool[]>
async getMcpResources(serverId: string): Promise<Resource[]>

// Skill 管理
interface SkillTemplate {
  name: string;
  description: string;
  author?: string;
  disableModelInvocation?: boolean;
  userInvocable?: boolean;
  allowedTools?: string[];
  context?: string;
  agent?: string;
  hooks?: string[];
  content: string;
}

async createSkill(scope: 'global' | 'project', skill: SkillTemplate): Promise<void>
async validateSkillFrontmatter(frontmatter: string): Promise<ValidationResult>
async testSkill(skillId: string, arguments: string[]): Promise<SkillTestResult>

// 环境变量
async expandEnvVars(value: string): Promise<string>
```

### 前端功能

#### 1. MCP 高级管理

**MCP 连接测试面板**
- 实时健康状态显示（状态指示器）
- 延迟监控（响应时间图表）
- 工具和资源统计
- 测试历史记录
- 自动刷新（可配置间隔）

**MCP 工具浏览器**
- 可调用工具列表
- 工具详情（参数、返回类型）
- 工具搜索和过滤
- 权限状态（allowed/blocked）
- 手动调用测试工具

**环境变量编辑器**
- ${VAR} 语法高亮
- 默认值支持 ${VAR:-default}
- 变量验证
- 环境变量预览

**权限管理器**
- allowlist/denylist 可视化
- 服务器模式配置
- 工具级别权限
- 权限继承关系

#### 2. Skills 增强

**Skill 创建向导**
- 步骤式引导流程
  1. 基本信息（名称、描述、作者）
  2. 高级配置（frontmatter 字段）
  3. 内容编辑（Markdown 编辑器）
  4. 预览和验证
- 模板选择（空白、常用模式）
- 实时验证
- 导出选项

**Frontmatter 编辑器**
- YAML 字段编辑器
- 字段说明和示例
- 语法验证
- 自动补全
- 预设模板

**Skill 测试面板**
- 模拟调用场景
- 参数输入
- 执行结果查看
- 错误诊断
- 性能监控

**动态上下文注入**
- !command 语法高亮
- 命令输出预览
- 注入点标记

#### 3. 中文支持（第一阶段）

**语言切换器**
- 顶部导航栏语言切换
- 持久化语言偏好

**菜单和按钮翻译**
- 侧边栏导航
- 操作按钮
- 表单标签

**本地化格式**
- 日期时间格式（中文格式）
- 数字格式（中文千分位）
- 货币格式（如需要）

### 技术实现

**后端技术栈**
- MCP 客户端：使用 `@modelcontextprotocol/sdk`
- HTTP 连接测试：fetch API with timeout
- stdio 测试：child_process.spawn
- YAML 解析：js-yaml
- 环境变量扩展：自定义解析器

**前端技术栈**
- 状态管理：Zustand store 扩展
- 实时更新：定时刷新 + WebSocket（可选）
- 图表：Recharts（延迟监控）
- 代码编辑：Monaco Editor（YAML + Markdown）
- 表单：React Hook Form + Zod 验证
- 国际化：react-i18next

### 新增文件

```
src/
├── components/
│   ├── mcp/
│   │   ├── MCPConnectionTester.tsx      # MCP连接测试面板
│   │   ├── MCPToolBrowser.tsx           # MCP工具浏览器
│   │   ├── MCPEnvEditor.tsx             # 环境变量编辑器
│   │   └── MCPPermissionManager.tsx     # 权限管理器
│   ├── skills/
│   │   ├── SkillCreateWizard.tsx        # Skill创建向导
│   │   ├── SkillFrontmatterEditor.tsx   # Frontmatter编辑器
│   │   ├── SkillTestPanel.tsx           # Skill测试面板
│   │   └── SkillContextInjector.tsx     # 上下文注入助手
│   └── ui/
│       ├── LanguageSwitcher.tsx         # 语言切换器
│       └── LatencyChart.tsx             # 延迟图表
├── lib/
│   ├── i18n.ts                          # 国际化配置
│   ├── mcp-client.ts                    # MCP客户端封装
│   └── yaml-validator.ts                # YAML验证器
└── locales/
    ├── zh-CN.json                       # 中文翻译
    └── en-US.json                       # 英文翻译

server/
├── handlers/
│   ├── mcp-test.ts                      # MCP测试处理器
│   ├── skill-manager.ts                 # Skill管理处理器
│   └── env-expander.ts                  # 环境变量扩展器
└── utils/
    └── mcp-connection.ts                # MCP连接工具
```

### API 路由

```
GET  /api/mcp/test/:serverId              # 测试MCP连接
GET  /api/mcp/tools/:serverId             # 获取MCP工具列表
GET  /api/mcp/resources/:serverId         # 获取MCP资源列表
GET  /api/mcp/health-history/:serverId    # 获取健康历史

POST /api/skills/create                   # 创建新Skill
POST /api/skills/validate-frontmatter     # 验证Frontmatter
POST /api/skills/test/:skillId            # 测试Skill执行
GET  /api/skills/templates                # 获取Skill模板

POST /api/env/expand                      # 扩展环境变量
```

### 测试计划

**单元测试**
- MCP 连接测试逻辑
- 环境变量扩展
- YAML 验证
- Skill 前模板解析

**集成测试**
- MCP 服务器连接流程
- Skill 创建和验证流程
- 工具浏览器数据加载

**E2E 测试**
- 完整的 Skill 创建流程
- MCP 测试和故障排查
- 语言切换功能

---

## 🎯 迭代 4：Memory & 配置管理（优先级：高）

### 目标
实现 Memory 文件管理和高级配置编辑功能。

### 后端 API

```typescript
async getAutoMemory(projectId: string): Promise<MemoryEntry[]>
async getRulesTree(projectId: string): Promise<RuleNode[]>
async parseMarkdownImports(content: string): Promise<string[]>
async validatePermissions(config: PermissionConfig): Promise<ValidationResult>
async saveClaudeMd(projectId: string, content: string): Promise<void>
```

### 前端功能

#### 1. Memory 管理

**CLAUDE.md 编辑器**
- Monaco + Markdown 实时预览
- 语法高亮
- 导入路径解析
- 分屏预览

**自动内存查看器**
- 分页显示
- 搜索和过滤
- 时间戳排序
- 删除和编辑

**规则树视图**
- .claude/rules/*.md 可视化
- 层级结构展示
- 拖拽排序
- 批量操作

**导入语法解析器**
- @path/to/file 高亮
- 循环依赖检测
- 文件存在性验证

#### 2. 高级配置

**可视化配置编辑器**
- JSON Schema 驱动表单
- 字段说明和验证
- 实时预览

**权限管理器**
- MCP 服务器权限
- 工具级别权限
- 继承关系图

**差异查看器**
- 配置变更对比
- 并排显示
- 逐字符高亮

**配置预设管理**
- 保存/加载模板
- 导入/导出
- 默认预设

#### 3. 中文支持（第二阶段）

- 中文帮助文档
- 错误消息本地化
- 工具提示翻译
- 中文示例模板

---

## 🎯 迭代 5：Hooks & 自动化（优先级：中）

### 目标
实现 Hooks 系统和自动化工作流功能。

### 后端 API

```typescript
async listHooks(eventType?: string): Promise<Hook[]>
async testHook(hookId: string, mockEvent: Event): Promise<HookResult>
async createWorkflow(steps: WorkflowStep[]): Promise<Workflow>
async executeWorkflow(workflowId: string): Promise<ExecutionResult>
```

### 前端功能

#### 1. Hooks 管理器

**15+ 事件浏览器**
- 事件类型说明
- 事件触发时机
- 示例代码

**Hook 创建向导**
- command/prompt/agent 类型选择
- 事件选择
- 退出码配置

**测试沙箱**
- 模拟事件触发
- 输出查看
- 错误调试

**Hook 日志查看器**
- 执行历史
- 过滤和搜索
- 性能统计

#### 2. 自动化功能

**工作流构建器**
- 拖拽式流程设计
- 节点连接
- 条件分支

**模板库**
- 常用场景
- 社区贡献

**预设管理器**
- Hook 组合
- 一键启用/禁用

#### 3. 中文支持（第三阶段）

- 完整 UI 翻译
- 中文技术文档
- Hook 事件中文说明
- 工作流模板中文化

---

## 🎯 迭代 6：Plugins & 生态系统（优先级：中）

### 目标
构建插件市场和企业级功能。

### 后端 API

```typescript
async searchPlugins(query: string): Promise<Plugin[]>
async installPlugin(pluginId: string): Promise<void>
async getPluginComponents(pluginId: string): Promise<PluginComponents>
async checkPluginUpdates(): Promise<UpdateInfo[]>
```

### 前端功能

#### 1. 插件市场

**官方插件库**
- 浏览、搜索、分类
- 详情页面
- 评分和评论

**社区插件**
- 用户贡献
- 验证状态

**安装向导**
- 依赖检查
- 权限确认
- 安装进度

**更新管理器**
- 自动检查
- 批量更新
- 更新日志

#### 2. 企业功能

**托管配置编辑器**
- 组织级策略
- 继承规则

**权限继承视图**
- scope 层级可视化
- 覆盖关系

**批量部署工具**
- 多项目管理
- 批量配置

**审计日志**
- 配置变更历史
- 操作追溯

#### 3. 中文生态完善

- 中文插件市场
- 本地化文档站点
- 中文社区论坛
- 本地成功案例

---

## 🇨🇳 中文用户专属功能

### UI/UX 优化
- CJK 字体支持（思源黑体、苹方）
- 输入法兼容性（IME 事件处理）
- 竖排文本支持（古典文档）
- 中文排版优化（标点、行距）

### 生态系统集成
- **通讯工具**：钉钉、企业微信、飞书
- **云服务**：阿里云、腾讯云、华为云
- **开发工具**：Gitee、Coding、码云
- **本地 LLM**：DeepSeek、通义千问、文心一言

### 区域特性
- GFW 兼容（代理设置、镜像源）
- 中国节假日日历
- 中文搜索优化（拼音、模糊匹配）
- 本地支付集成（支付宝、微信支付）

---

## 📅 实施建议

### 优先级排序
1. **立即开始**：迭代 3 的 MCP 连接测试 + Skill 创建向导
2. **短期目标**：迭代 4 的 Memory 管理（高频需求）
3. **中期规划**：迭代 5 的 Hooks 系统（高级用户）
4. **长期愿景**：迭代 6 的插件市场（生态建设）

### 中文支持节奏
- **第 1-2 周**：基础 UI 中英双语
- **第 3-4 周**：帮助文档和错误消息
- **第 5-6 周**：完整本地化和示例模板
- **第 7-8 周**：中文插件和社区建设

---

## 🎓 参考文档

- [ClaudeCode Skills 文档](https://code.claude.com/docs/en/skills)
- [ClaudeCode MCP 文档](https://code.claude.com/docs/en/mcp)
- [ClaudeCode Plugins 文档](https://code.claude.com/docs/en/plugins)
- [ClaudeCode Memory 文档](https://code.claude.com/docs/en/memory)
- [ClaudeCode Hooks 文档](https://code.claude.com/docs/en/hooks)

---

**文档版本**: 1.0
**最后更新**: 2026-02-07
