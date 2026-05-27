'use client';

import React, { useState } from 'react';
import {
  ChevronRight, ChevronDown, Folder, Search, Home, Package,
  Edit, Plus, Eye, MoreHorizontal, X, ArrowUp, ArrowDown,
} from 'lucide-react';
import { bomItems, moduleSpecs, type BOMItem, type ModuleSpec, configOrderTree, type TreeNode } from '@/lib/mock-data';
import { Sidebar } from '@/components/shared/sidebar';
import { TopBar } from '@/components/shared/top-bar';
import { cn } from '@/lib/utils';

type BomTab = 'structure' | 'material' | 'route' | 'hours' | 'tool' | 'materialLib' | 'term' | 'typical';
type MainTab = 'module' | 'process' | 'order';

export default function BOMPage() {
  const [mainTab, setMainTab] = useState<MainTab>('module');
  const [bomTab, setBomTab] = useState<BomTab>('structure');
  const [selectedTreeNode, setSelectedTreeNode] = useState<string>('order_sub1');
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [showConstraintModal, setShowConstraintModal] = useState(false);
  const [editingSpec, setEditingSpec] = useState<ModuleSpec | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    order_root: true, order_cat1: true, order_sub1: true, order_series1: true, order_product1: true,
  });

  const bomTabs: { key: BomTab; label: string }[] = [
    { key: 'structure', label: 'BOM结构' },
    { key: 'material', label: '材料定额' },
    { key: 'route', label: '工艺路线' },
    { key: 'hours', label: '工时定额' },
    { key: 'tool', label: '工具库' },
    { key: 'materialLib', label: '材料库' },
    { key: 'term', label: '工艺术语库' },
    { key: 'typical', label: '典型工艺库' },
  ];

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />

        {/* Tab Bar */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-200">
          {(['module', 'process', 'order'] as MainTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setMainTab(tab)}
              className={cn(
                'px-3 py-1 text-sm rounded-sm transition-colors',
                mainTab === tab ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab === 'module' ? '模块库' : tab === 'process' ? '工艺库' : '订单库'}
            </button>
          ))}
          <div className="flex-1" />
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-2 py-1">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input type="text" placeholder="搜索..." className="bg-transparent text-sm focus:outline-none w-40" />
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Tree */}
          <div className="w-[240px] border-r border-gray-200 flex flex-col shrink-0">
            <div className="flex-1 overflow-y-auto py-2">
              <ConfigTreeRenderer
                nodes={configOrderTree}
                expanded={expandedNodes}
                onToggle={toggleNode}
                selectedId={selectedTreeNode}
                onSelect={setSelectedTreeNode}
                depth={0}
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col flex-1 min-w-0">
            {/* Action Bar */}
            <div className="px-4 py-2 border-b border-gray-100 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {['新增', '插入', '编辑', '删除', '保存', '刷新', '审批'].map((action) => (
                  <button key={action} className="text-xs text-blue-600 hover:text-blue-800 transition-colors">{action}</button>
                ))}
                <select className="text-xs border border-gray-200 rounded px-1 py-0.5 text-gray-600">
                  <option>版本1</option>
                  <option>版本2</option>
                </select>
                <button className="text-xs text-blue-600 hover:text-blue-800">保存版本</button>
                <button className="text-xs text-blue-600 hover:text-blue-800">废止此版本</button>
              </div>
              <div className="flex items-center gap-1">
                {bomTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setBomTab(tab.key)}
                    className={cn(
                      'px-2 py-0.5 text-xs transition-colors',
                      bomTab === tab.key ? 'text-blue-600 font-medium border-b border-blue-500' : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* BOM Table */}
            <div className="flex-1 overflow-auto">
              {bomTab === 'structure' && <BOMStructureTable items={bomItems} />}
              {bomTab === 'material' && <MaterialTable />}
              {bomTab === 'route' && <ProcessRouteTable />}
              {['hours', 'tool', 'materialLib', 'term', 'typical'].includes(bomTab) && (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">暂无数据</div>
              )}
            </div>

            {/* Module Cards (when module tab selected) */}
            {mainTab === 'module' && bomTab === 'structure' && (
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">产品系列1</h3>
                </div>
                <div className="grid grid-cols-6 gap-2 mb-4">
                  {['前封头模块', '后封头模块', '支腿托架模块', '防撞梁模块', '管道模块', '防爆板模块', '连接杆模块', '支撑杆模块', '中横梁模块', '支撑腿模块', '离合器模块'].map((name, i) => (
                    <div key={i} className={cn('border rounded-md p-2 text-center cursor-pointer hover:border-blue-400', i === 0 && 'bg-blue-50 border-blue-300')}>
                      <div className="text-xs text-gray-700">{name}</div>
                      <button className="mt-1 text-[10px] text-blue-500 hover:text-blue-700" onClick={() => { setShowSpecModal(true); setEditingSpec(moduleSpecs[0]); }}>编辑</button>
                    </div>
                  ))}
                  <div className="border border-dashed border-gray-300 rounded-md p-2 flex items-center justify-center cursor-pointer hover:border-blue-400">
                    <Plus className="w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Specs Table */}
                <div className="border rounded-md overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                    <span className="text-xs font-medium text-gray-700">前封头模块 规格表</span>
                    <div className="flex items-center gap-2">
                      <button className="text-[10px] text-blue-500">编辑</button>
                      <button className="text-[10px] text-blue-500">保存</button>
                    </div>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-2 py-1.5 text-left w-8"><input type="checkbox" /></th>
                        <th className="px-2 py-1.5 text-left">规格名称</th>
                        <th className="px-2 py-1.5 text-left">截面形式</th>
                        <th className="px-2 py-1.5 text-left">材质</th>
                        <th className="px-2 py-1.5 text-left">壁厚</th>
                        <th className="px-2 py-1.5 text-left">连接方式</th>
                        <th className="px-2 py-1.5 text-left">模块编码</th>
                        <th className="px-2 py-1.5 text-left w-24">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {moduleSpecs.map((spec) => (
                        <tr key={spec.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-2 py-1.5"><input type="checkbox" /></td>
                          <td className="px-2 py-1.5 text-gray-700">{spec.name}</td>
                          <td className="px-2 py-1.5 text-gray-600">{spec.sectionForm}</td>
                          <td className="px-2 py-1.5 text-gray-600">{spec.material}</td>
                          <td className="px-2 py-1.5 text-gray-600">{spec.wallThickness}</td>
                          <td className="px-2 py-1.5 text-gray-600">{spec.connectionMethod}</td>
                          <td className="px-2 py-1.5 text-gray-600 font-mono text-[11px]">{spec.moduleCode}</td>
                          <td className="px-2 py-1.5">
                            <div className="flex items-center gap-2">
                              <button className="text-blue-500 hover:text-blue-700" onClick={() => { setShowSpecModal(true); setEditingSpec(spec); }}>编辑</button>
                              <button className="text-gray-400 hover:text-gray-600">更多...</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-2 py-2 border-t border-gray-100">
                    <button className="flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-700">
                      <Plus className="w-3 h-3" /> 新增规格
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spec Modal */}
      {showSpecModal && editingSpec && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowSpecModal(false)}>
          <div className="bg-white rounded-lg shadow-xl w-[440px] max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-800">前封头模块 规格维护</h3>
              <button onClick={() => setShowSpecModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              {[
                { label: '规格名称', value: editingSpec.name },
                { label: '截面形式', value: editingSpec.sectionForm },
                { label: '材质', value: editingSpec.material, type: 'select' },
                { label: '壁厚', value: editingSpec.wallThickness },
                { label: '连接方式', value: editingSpec.connectionMethod, type: 'select' },
                { label: '模块编码', value: editingSpec.moduleCode },
              ].map((field) => (
                <div key={field.label} className="flex items-center gap-3">
                  <label className="w-20 text-xs text-gray-500 text-right shrink-0">{field.label}</label>
                  {field.type === 'select' ? (
                    <select className="flex-1 text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400">
                      <option>{field.value}</option>
                    </select>
                  ) : (
                    <input type="text" defaultValue={field.value} className="flex-1 text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400" />
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200">
              <button onClick={() => setShowSpecModal(false)} className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700">取消</button>
              <button onClick={() => setShowSpecModal(false)} className="px-4 py-1.5 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded">确认</button>
            </div>
          </div>
        </div>
      )}

      {/* Constraint Modal */}
      {showConstraintModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowConstraintModal(false)}>
          <div className="bg-white rounded-lg shadow-xl w-[560px] max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-800">前封头模块 约束性参数维护</h3>
              <button onClick={() => setShowConstraintModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">参数名称</label>
                  <input type="text" className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 mt-1 focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">参数类型</label>
                  <select className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 mt-1">
                    <option>文本</option><option>数值</option><option>日期</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">控件类型</label>
                  <select className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 mt-1">
                    <option>文本框</option><option>下拉框</option><option>日期选择器</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">默认值</label>
                  <input type="text" placeholder="下拉框时，用英文逗号隔开选项值" className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 mt-1 focus:outline-none focus:border-blue-400" />
                </div>
              </div>
              <button className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700">
                <Plus className="w-3 h-3" /> 添加
              </button>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-2 py-1.5 text-left">参数名称</th>
                      <th className="px-2 py-1.5 text-left">参数类型</th>
                      <th className="px-2 py-1.5 text-left">控件类型</th>
                      <th className="px-2 py-1.5 text-left">默认值</th>
                      <th className="px-2 py-1.5 text-left w-20">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: '截面形式', type: '文本', control: '文本框', default: 'Null' },
                      { name: '材质', type: '文本', control: '文本框', default: 'Null' },
                      { name: '连接方式', type: '文本', control: '下拉框', default: 'Null' },
                      { name: '壁厚', type: '数值', control: '文本框', default: 'Null' },
                    ].map((param, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="px-2 py-1.5">{param.name}</td>
                        <td className="px-2 py-1.5">{param.type}</td>
                        <td className="px-2 py-1.5">{param.control}</td>
                        <td className="px-2 py-1.5 text-gray-400">{param.default}</td>
                        <td className="px-2 py-1.5">
                          <div className="flex items-center gap-1">
                            <button className="text-blue-400 hover:text-blue-600"><ArrowUp className="w-3 h-3" /></button>
                            <button className="text-blue-400 hover:text-blue-600"><ArrowDown className="w-3 h-3" /></button>
                            <button className="text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200">
              <button onClick={() => setShowConstraintModal(false)} className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700">取消</button>
              <button onClick={() => setShowConstraintModal(false)} className="px-4 py-1.5 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded">确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BOMStructureTable({ items }: { items: BOMItem[] }) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200 sticky top-0">
          <th className="px-2 py-1.5 text-left w-8"><input type="checkbox" /></th>
          <th className="px-2 py-1.5 text-left w-10">层次</th>
          <th className="px-2 py-1.5 text-left">物料编码</th>
          <th className="px-2 py-1.5 text-left">图号</th>
          <th className="px-2 py-1.5 text-left">名称</th>
          <th className="px-2 py-1.5 text-left">材质</th>
          <th className="px-2 py-1.5 text-left">重量</th>
          <th className="px-2 py-1.5 text-left">来源类型</th>
          <th className="px-2 py-1.5 text-left">库位</th>
          <th className="px-2 py-1.5 text-left">单位</th>
          <th className="px-2 py-1.5 text-left">单层数量</th>
          <th className="px-2 py-1.5 text-left">备注</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr key={item.id} className={cn('border-b border-gray-50 hover:bg-gray-50', i % 2 === 1 && 'bg-green-50/20')}>
            <td className="px-2 py-1.5"><input type="checkbox" /></td>
            <td className="px-2 py-1.5 text-gray-500" style={{ paddingLeft: `${item.level * 16 + 8}px` }}>
              {item.level === 0 ? <ChevronDown className="w-3 h-3 inline" /> : null} {item.level}
            </td>
            <td className="px-2 py-1.5 font-mono text-[10px]">{item.materialCode}</td>
            <td className="px-2 py-1.5 text-gray-500">{item.drawingNo || '-'}</td>
            <td className="px-2 py-1.5 text-gray-800 font-medium">{item.name}</td>
            <td className="px-2 py-1.5 text-gray-600">{item.material}</td>
            <td className="px-2 py-1.5 text-gray-600">{item.weight}</td>
            <td className="px-2 py-1.5"><span className={cn('text-[10px] px-1 py-0.5 rounded', item.sourceType === 'M' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600')}>{item.sourceType === 'M' ? '自制' : '外购'}</span></td>
            <td className="px-2 py-1.5 text-gray-600">{item.location}</td>
            <td className="px-2 py-1.5 text-gray-600">{item.unit}</td>
            <td className="px-2 py-1.5 text-gray-600">{item.quantity}</td>
            <td className="px-2 py-1.5 text-gray-400">{item.remark || '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MaterialTable() {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200 sticky top-0">
          <th className="px-2 py-1.5 text-left w-8"><input type="checkbox" /></th>
          <th className="px-2 py-1.5 text-left w-10">层次</th>
          <th className="px-2 py-1.5 text-left">物料编码</th>
          <th className="px-2 py-1.5 text-left">图号</th>
          <th className="px-2 py-1.5 text-left">名称</th>
          <th className="px-2 py-1.5 text-left">材质</th>
          <th className="px-2 py-1.5 text-left">重量</th>
          <th className="px-2 py-1.5 text-left">来源类型</th>
          <th className="px-2 py-1.5 text-left">库位</th>
          <th className="px-2 py-1.5 text-left">单位</th>
          <th className="px-2 py-1.5 text-left">单层数量</th>
          <th className="px-2 py-1.5 text-left">备注</th>
        </tr>
      </thead>
      <tbody>
        <tr className="h-20"><td colSpan={12} className="text-center text-gray-400 py-8">暂无数据，请新增材料定额</td></tr>
      </tbody>
    </table>
  );
}

function ProcessRouteTable() {
  const routeData = [
    { level: 0, code: 'DSW2135001', name: '前封头模块', seq: '10', process: '下料', center: '下料车间' },
    { level: 1, code: 'DSW2135002', name: '封头成型', seq: '20', process: '冲压成型', center: '冲压车间' },
    { level: 1, code: 'DSW2135003', name: '封头热处理', seq: '30', process: '固溶处理', center: '热处理车间' },
    { level: 2, code: 'DSW2135004', name: '封头机加工', seq: '40', process: '数控车削', center: '机加工车间' },
    { level: 2, code: 'DSW2135005', name: '封头检验', seq: '50', process: '尺寸检验', center: '质检部' },
  ];

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200 sticky top-0">
          <th className="px-2 py-1.5 text-left w-8"><input type="checkbox" /></th>
          <th className="px-2 py-1.5 text-left w-10">层次</th>
          <th className="px-2 py-1.5 text-left">物料编码</th>
          <th className="px-2 py-1.5 text-left">图号</th>
          <th className="px-2 py-1.5 text-left">名称</th>
          <th className="px-2 py-1.5 text-left">来源类型</th>
          <th className="px-2 py-1.5 text-left">工序顺序号</th>
          <th className="px-2 py-1.5 text-left">工序号</th>
          <th className="px-2 py-1.5 text-left">所属工作中心</th>
        </tr>
      </thead>
      <tbody>
        {routeData.map((item, i) => (
          <tr key={i} className={cn('border-b border-gray-50 hover:bg-gray-50', i % 2 === 1 && 'bg-green-50/20')}>
            <td className="px-2 py-1.5"><input type="checkbox" defaultChecked={i < 3} /></td>
            <td className="px-2 py-1.5 text-gray-500">{item.level}</td>
            <td className="px-2 py-1.5 font-mono text-[10px]">{item.code}</td>
            <td className="px-2 py-1.5 text-gray-500">-</td>
            <td className="px-2 py-1.5 text-gray-800 font-medium">{item.name}</td>
            <td className="px-2 py-1.5 text-gray-600">自制件</td>
            <td className="px-2 py-1.5 text-gray-600">{item.seq}</td>
            <td className="px-2 py-1.5 text-gray-600">{item.process}</td>
            <td className="px-2 py-1.5 text-gray-600">{item.center}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ConfigTreeRenderer({ nodes, expanded, onToggle, selectedId, onSelect, depth }: {
  nodes: TreeNode[]; expanded: Record<string, boolean>; onToggle: (id: string) => void;
  selectedId: string; onSelect: (id: string) => void; depth: number;
}) {
  return (
    <>
      {nodes.map((node) => {
        const isExpanded = expanded[node.id];
        const hasChildren = node.children && node.children.length > 0;
        const isSelected = selectedId === node.id;

        return (
          <div key={node.id}>
            <button
              onClick={() => { onSelect(node.id); if (hasChildren) onToggle(node.id); }}
              className={cn('w-full flex items-center gap-1.5 py-1 px-2 text-sm', isSelected ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50')}
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
              {hasChildren ? (isExpanded ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />) : <span className="w-3 shrink-0" />}
              {node.type === 'folder' && (node.icon === 'home' ? <Home className="w-3.5 h-3.5 text-blue-400 shrink-0" /> : <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />)}
              {node.type === 'module' && <Package className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
              <span className="truncate">{node.name}</span>
            </button>
            {hasChildren && isExpanded && (
              <ConfigTreeRenderer nodes={node.children!} expanded={expanded} onToggle={onToggle} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />
            )}
          </div>
        );
      })}
    </>
  );
}
