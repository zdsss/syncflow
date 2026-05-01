import type { FileRecord } from '@/types';

const fileTypes: Array<{ ext: string; type: FileRecord['type'] }> = [
  { ext: '.docx', type: 'document' },
  { ext: '.pdf', type: 'document' },
  { ext: '.xlsx', type: 'spreadsheet' },
  { ext: '.png', type: 'image' },
  { ext: '.jpg', type: 'image' },
  { ext: '.svg', type: 'image' },
  { ext: '.ts', type: 'code' },
  { ext: '.js', type: 'code' },
];

const fileNames = [
  '电池Pack设计规格书', 'BOM清单-v3', '热管理方案评审报告',
  '测试报告-低温放电', '组装工艺SOP', '电池模组结构图',
  'Pack外壳3D模型', '冷却液选型对比表', '项目进度跟踪表',
  '风险评估报告', '质量检验标准', '供应商审核记录',
  '设计变更通知单', '工程变更申请表', '客户反馈汇总',
  '样品测试数据', '模具设计图纸', '电气原理图',
  '焊接工艺参数表', '绝缘测试记录', 'Pack标识设计稿',
  '产品使用说明书', '培训材料', '技术方案对比',
  '成本分析报告', '采购订单汇总', '交期评估表',
  '生产排程表', '来料检验报告', '质量异常处理单',
];

function generateFiles(): FileRecord[] {
  return fileNames.map((name, i) => {
    const ft = fileTypes[i % fileTypes.length];
    return {
      id: `f${i + 1}`,
      name: `${name}${ft.ext}`,
      type: ft.type,
      extension: ft.ext,
      size: Math.floor(Math.random() * 50 * 1024 * 1024) + 100 * 1024,
      path: `/files/${name}${ft.ext}`,
      parentFolderId: null,
      uploaderId: `u${(i % 15) + 1}`,
      version: Math.floor(Math.random() * 3) + 1,
      projectId: `p${(i % 10) + 1}`,
      downloadCount: Math.floor(Math.random() * 20),
      isDeleted: false,
      createdAt: `2025-0${(i % 5) + 1}-${String((i % 28) + 1).padStart(2, '0')}T08:00:00Z`,
      updatedAt: `2025-04-${String((i % 28) + 1).padStart(2, '0')}T08:00:00Z`,
    };
  });
}

export const mockFiles = generateFiles();
