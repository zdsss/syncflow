import i18n from '../index';

describe('i18n config', () => {
  it('has all namespaces registered', () => {
    const expectedNs = ['common', 'sidebar', 'dashboard', 'todo', 'files', 'project', 'config', 'approval', 'bom', 'query', 'resources', 'knowledge', 'template', 'personal', 'auth', 'validation', 'process'];
    expect(i18n.options.ns).toEqual(expectedNs);
  });

  it('has approval namespace resources for zh', () => {
    const resources = i18n.options.resources as any;
    expect(resources.zh.approval).toBeDefined();
    expect(resources.zh.approval.approval.title).toBe('审批管理');
    expect(resources.zh.approval.approval.submit).toBe('提交审批');
  });

  it('has bom namespace resources for en', () => {
    const resources = i18n.options.resources as any;
    expect(resources.en.bom).toBeDefined();
    expect(resources.en.bom.bom.title).toBe('BOM Management');
    expect(resources.en.bom.bom.supplier).toBe('Supplier');
  });
});
