'use client';

import React, { useState } from 'react';
import {
  ChevronRight, ChevronDown, Folder, Search, File, FileText,
  Download, Eye, MoreHorizontal, Edit, FileSpreadsheet, FileImage,
} from 'lucide-react';
import { fileItems, type FileItem } from '@/lib/mock-data';
import { Sidebar } from '@/components/shared/sidebar';
import { TopBar } from '@/components/shared/top-bar';
import { TaskQuickBar } from '@/components/shared/task-quick-bar';
import { cn } from '@/lib/utils';

const fileTree = [
  { id: 'root', name: '文件管理', type: 'folder' as const, children: [
    { id: 'f1', name: '比亚迪底部水冷项目', type: 'folder' as const, children: [
      { id: 'f1-1', name: '济南鲁能自动线项目', type: 'folder' as const, children: [] },
      { id: 'f1-2', name: '设计文件', type: 'folder' as const, children: [] },
    ]},
    { id: 'f2', name: '济南鲁能自动线项目', type: 'folder' as const, children: [] },
    { id: 'f3', name: '比亚迪底部水冷项目', type: 'folder' as const, children: [] },
  ]},
];

function getFileIcon(type: FileItem['type']) {
  switch (type) {
    case 'dwg': return <FileImage className="w-4 h-4 text-red-500" />;
    case 'sldasm': return <FileSpreadsheet className="w-4 h-4 text-red-600" />;
    case 'docx': return <FileText className="w-4 h-4 text-blue-500" />;
    case 'pdf': return <File className="w-4 h-4 text-red-400" />;
    default: return <Folder className="w-4 h-4 text-amber-400" />;
  }
}

export default function FilesPage() {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ root: true, f1: true });
  const [selectedFolder, setSelectedFolder] = useState('root');

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <div className="flex flex-1 min-h-0">
          {/* File Tree */}
          <div className="w-[260px] border-r border-gray-200 flex flex-col shrink-0">
            <div className="px-3 py-2 border-b border-gray-100">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5">
                <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <input type="text" placeholder="搜索文件..." className="flex-1 min-w-0 bg-transparent text-sm focus:outline-none" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              <TreeRenderer nodes={fileTree} expanded={expandedNodes} onToggle={toggleNode} selectedId={selectedFolder} onSelect={setSelectedFolder} depth={0} />
            </div>
          </div>

          {/* File List */}
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">名称</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">关联项目</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">状态</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">修改日期</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-20">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {fileItems.map((file, i) => (
                    <tr key={file.id} className={cn('border-b border-gray-50 hover:bg-gray-50', i % 2 === 1 && 'bg-gray-50/30')}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {getFileIcon(file.type)}
                          <span className="text-sm text-gray-800">{file.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-blue-500 cursor-pointer hover:underline">{file.project}</td>
                      <td className="px-4 py-2.5">
                        {file.status && (
                          <span className={cn(
                            'text-[11px] px-1.5 py-0.5 rounded',
                            file.status === '已发布' ? 'bg-green-50 text-green-600' :
                            file.status === '已锁定' ? 'bg-gray-100 text-gray-600' :
                            'bg-blue-50 text-blue-600'
                          )}>{file.status}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">{file.modifiedDate}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-blue-500 rounded"><Edit className="w-3.5 h-3.5" /></button>
                          <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-blue-500 rounded"><Eye className="w-3.5 h-3.5" /></button>
                          <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-blue-500 rounded"><MoreHorizontal className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TaskQuickBar />
          </div>
        </div>
      </div>
    </div>
  );
}

function TreeRenderer({ nodes, expanded, onToggle, selectedId, onSelect, depth }: {
  nodes: typeof fileTree; expanded: Record<string, boolean>; onToggle: (id: string) => void;
  selectedId: string; onSelect: (id: string) => void; depth: number;
}) {
  return (
    <>
      {nodes.map((node) => {
        const isExpanded = expanded[node.id];
        const hasChildren = node.children && node.children.length > 0;
        return (
          <div key={node.id}>
            <button
              onClick={() => { onSelect(node.id); if (hasChildren) onToggle(node.id); }}
              className={cn('w-full flex items-center gap-1.5 py-1 px-2 text-sm', selectedId === node.id ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50')}
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
              {hasChildren ? (isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />) : <span className="w-3" />}
              <Folder className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate">{node.name}</span>
            </button>
            {hasChildren && isExpanded && (
              <TreeRenderer nodes={node.children!} expanded={expanded} onToggle={onToggle} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />
            )}
          </div>
        );
      })}
    </>
  );
}
