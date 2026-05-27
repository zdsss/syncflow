'use client';

import React, { useState } from 'react';
import {
  ChevronRight, ChevronDown, Folder, Search, Home, Package, PanelLeft,
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { configOrderTree, configModuleTree, type TreeNode } from '@/lib/mock-data';
import { Sidebar } from '@/components/shared/sidebar';
import { TopBar } from '@/components/shared/top-bar';
import { cn } from '@/lib/utils';

type ConfigTab = 'order' | 'module';

export default function ConfigPage() {
  const [configTab, setConfigTab] = useState<ConfigTab>('order');
  const [selectedTreeNode, setSelectedTreeNode] = useState<string>('order_sub1');
  const [showTree, setShowTree] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    order_root: true, order_cat1: true, order_sub1: true, order_series1: true, order_product1: true,
    module_root: true, module_cat1: true, module_sub1: true,
  });

  const tree = configTab === 'order' ? configOrderTree : configModuleTree;

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
          {(['order', 'module'] as ConfigTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setConfigTab(tab)}
              className={cn(
                'px-3 py-1 text-sm rounded-sm transition-colors',
                configTab === tab ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab === 'order' ? '订单库' : '模块库'}
            </button>
          ))}
          <div className="flex-1" />
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-2 py-1">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input type="text" placeholder={`搜索${configTab === 'order' ? '订单' : '模块'}...`} className="bg-transparent text-sm focus:outline-none w-40" />
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Mobile Tree Toggle */}
          <button onClick={() => setShowTree(true)} className="md:hidden absolute top-[7.5rem] left-12 z-10 p-2 text-gray-500 hover:text-gray-700">
            <PanelLeft className="w-5 h-5" />
          </button>
          <Sheet open={showTree} onOpenChange={setShowTree}>
            <SheetContent side="left" className="w-[280px] p-0">
              <div className="flex-1 overflow-y-auto py-2 pt-10">
                <ConfigTreeRenderer
                  nodes={tree}
                  expanded={expandedNodes}
                  onToggle={toggleNode}
                  selectedId={selectedTreeNode}
                  onSelect={(id) => { setSelectedTreeNode(id); setShowTree(false); }}
                  depth={0}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Tree */}
          <div className="hidden md:flex md:w-[280px] border-r border-gray-200 flex-col shrink-0">
            <div className="flex-1 overflow-y-auto py-2">
              <ConfigTreeRenderer
                nodes={tree}
                expanded={expandedNodes}
                onToggle={toggleNode}
                selectedId={selectedTreeNode}
                onSelect={setSelectedTreeNode}
                depth={0}
              />
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex items-center justify-center min-w-0">
            <div className="text-center space-y-3">
              <div className="text-sm text-gray-400">
                选择左侧{configTab === 'order' ? '订单' : '模块'}节点查看详情
              </div>
              <div className="text-xs text-gray-300">
                {/* 后端接口: GET /api/config/{type}/{nodeId} 获取节点详情 */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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
