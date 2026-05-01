export const NAV_ITEMS = [
  { key: 'workspace', path: '/todo', label: '工作空间', labelEn: 'Workspace', iconKey: 'workspace' },
  { key: 'project', path: '/project', label: '项目管理', labelEn: 'Project Management', iconKey: 'project-mgmt' },
  { key: 'dashboard', path: '/dashboard', label: '中控看板', labelEn: 'Central Dashboard', iconKey: 'dashboard' },
  { key: 'files', path: '/files', label: '文件管理', labelEn: 'File Management', iconKey: 'file-mgmt' },
  { key: 'bom', path: '/bom', label: 'BOM管理', labelEn: 'BOM Management', iconKey: 'bom-mgmt', comingSoon: true },
  { key: 'process', path: '/process', label: '工艺管理', labelEn: 'Process Management', iconKey: 'process-mgmt', comingSoon: true },
  { key: 'config', path: '/config', label: '配置管理', labelEn: 'Configuration', iconKey: 'config-mgmt' },
  { key: 'query', path: '/query', label: '查询统计', labelEn: 'Query & Statistics', iconKey: 'query-stats', comingSoon: true },
  { key: 'resources', path: '/resources', label: '通用资源', labelEn: 'General Resources', iconKey: 'resources', comingSoon: true },
  { key: 'knowledge', path: '/knowledge', label: '知识管理', labelEn: 'Knowledge Management', iconKey: 'knowledge', comingSoon: true },
  { key: 'template', path: '/template', label: '模板定义', labelEn: 'Template Definition', iconKey: 'template', comingSoon: true },
  { key: 'personal', path: '/personal', label: '个人文件夹', labelEn: 'Personal Folder', iconKey: 'personal-folder', comingSoon: true },
] as const;
