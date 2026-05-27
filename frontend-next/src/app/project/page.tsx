'use client';

import React, { useState } from 'react';
import {
  ChevronRight, ChevronDown, Folder, CheckCircle2, Circle, Search,
  Play, Pause, RotateCcw, Monitor, Download, Star, MoreHorizontal,
  Eye, File, FileText, Users, Clock, Bell, RefreshCw, Flag,
  ArrowRight, ArrowDown, PanelLeft,
} from 'lucide-react';
import { projectTree, type TreeNode, mockUsers } from '@/lib/mock-data';
import { Sidebar } from '@/components/shared/sidebar';
import { TopBar } from '@/components/shared/top-bar';
import { TaskQuickBar } from '@/components/shared/task-quick-bar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type ViewTab = 'basic' | 'plan' | 'swimlane' | 'gantt';

interface PlanTask {
  phase: string;
  name: string;
  assignee: string;
  dept: string;
  planHours: string;
  actualHours: string;
  progress: number;
  duration: string;
  deliverable: boolean;
  milestone: boolean;
}

interface GanttTask {
  phase: string;
  name: string;
  duration: string;
  progress: number;
  barOffset: number;
  barWidth: number;
}

interface SwimlaneStage {
  name: string;
  progress: number;
}

interface SwimlaneLane {
  name: string;
  tasks: string[];
}

interface SwimlaneData {
  stages: SwimlaneStage[];
  lanes: SwimlaneLane[];
  reviewNodes: string[];
  checkpoints: string[];
}

export default function ProjectPage() {
  const [viewTab, setViewTab] = useState<ViewTab>('basic');
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(projectTree[1]?.children?.[1] || null);
  const [showApproval, setShowApproval] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);
  const [showDependency, setShowDependency] = useState(false);
  const [autoExtend, setAutoExtend] = useState(true);

  const planTasks: PlanTask[] = [
    { phase: 'P1', name: '阶段110', assignee: '张晓菁', dept: '市场部', planHours: '10h', actualHours: '5h', progress: 50, duration: '20250810-20250811', deliverable: true, milestone: false },
    { phase: '1', name: '任务111', assignee: '李如云', dept: '市场部', planHours: '10h', actualHours: '8h', progress: 80, duration: '20250810-20250811', deliverable: false, milestone: true },
    { phase: '2', name: '任务112', assignee: '去选择', dept: '-', planHours: '10h', actualHours: '0h', progress: 0, duration: '20250810-20250811', deliverable: false, milestone: false },
    { phase: 'P2', name: '阶段120', assignee: '黄奕鹤', dept: '技术部', planHours: '10h', actualHours: '5h', progress: 50, duration: '20250810-20250811', deliverable: true, milestone: false },
  ];

  const ganttTasks: GanttTask[] = [
    { phase: 'P1', name: '概念阶段', duration: '20250810-20250811', progress: 100, barOffset: 10, barWidth: 25 },
    { phase: '', name: '思维导图', duration: '20250810-20250811', progress: 100, barOffset: 13, barWidth: 22 },
    { phase: '', name: '原型设计', duration: '20250810-20250811', progress: 100, barOffset: 16, barWidth: 28 },
    { phase: 'P2', name: '计划阶段', duration: '20250810-20250811', progress: 90, barOffset: 19, barWidth: 30 },
    { phase: '', name: '计划制定', duration: '20250810-20250811', progress: 100, barOffset: 22, barWidth: 20 },
    { phase: '', name: '可制造性分析', duration: '20250810-20250811', progress: 100, barOffset: 25, barWidth: 26 },
    { phase: '', name: '需求变更说明', duration: '20250810-20250811', progress: 40, barOffset: 28, barWidth: 32 },
  ];

  const swimlaneData: SwimlaneData = {
    stages: [
      { name: '概念', progress: 100 },
      { name: '计划', progress: 90 },
      { name: '开发', progress: 0 },
      { name: '测试', progress: 0 },
      { name: '生产', progress: 0 },
    ],
    lanes: [
      { name: 'PDT', tasks: ['Charter DCP', 'CDCP', 'PDCP'] },
      { name: '市场', tasks: ['需求说明', '可行性报告'] },
      { name: '产品', tasks: ['需求变更说明', '变更审批'] },
      { name: '研发', tasks: ['需求分析', '架构与系统设计', '结构开发', '整机测试'] },
      { name: '制造', tasks: ['制造方案及验证计划', '主生产计划制定', '派工生产', '验收入库'] },
    ],
    reviewNodes: ['TR1', 'TR2', 'TR3', 'TR4', 'TR5', 'TR6'],
    checkpoints: ['CDCP', 'PDCP', 'ADCP', 'GA'],
  };

  const treeContent = (
    <>
      <div className="px-3 py-2 border-b border-gray-100">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input type="text" placeholder="搜索项目..." className="flex-1 min-w-0 bg-transparent text-sm focus:outline-none" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        <TreeNodeComponent
          nodes={projectTree}
          selectedId={selectedNode?.id}
          onSelect={setSelectedNode}
          depth={0}
        />
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <div className="flex flex-1 min-h-0">
          {/* Project Structure Tree - Desktop */}
          <div className="hidden md:flex w-[260px] border-r border-gray-200 flex-col shrink-0">
            {treeContent}
          </div>

          {/* Main Content */}
          <div className="flex flex-col flex-1 min-w-0">
            {/* Project Header */}
            <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Mobile tree toggle */}
                <Sheet>
                  <SheetTrigger asChild>
                    <button className="md:hidden w-7 h-7 flex items-center justify-center text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors">
                      <PanelLeft className="w-4 h-4" />
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
                    <SheetTitle className="sr-only">项目结构</SheetTitle>
                    {treeContent}
                  </SheetContent>
                </Sheet>
                <h2 className="text-sm font-medium text-gray-800">比亚迪底部水冷项目</h2>
                <span className="text-xs text-blue-500 font-medium">30%</span>
              </div>
              <div className="flex items-center gap-1">
                {[Play, Pause, RotateCcw, Monitor, Star, Download].map((Icon, i) => (
                  <button key={i} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors">
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>

            {/* View Tabs */}
            <div className="px-4 pt-2 border-b border-gray-100 overflow-x-auto">
              <div className="flex items-center gap-4 min-w-max">
                {(['basic', 'plan', 'swimlane', 'gantt'] as ViewTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setViewTab(tab)}
                    className={cn(
                      'pb-2 text-sm transition-colors relative whitespace-nowrap',
                      viewTab === tab
                        ? 'text-blue-600 font-medium'
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    {tab === 'basic' ? '基本' : tab === 'plan' ? '计划表' : tab === 'swimlane' ? '泳道图' : '甘特图'}
                    {viewTab === tab && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Options */}
            <div className="px-4 py-2 flex flex-wrap items-center gap-2 md:gap-4 border-b border-gray-50">
              <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                <input type="checkbox" checked={showApproval} onChange={(e) => setShowApproval(e.target.checked)} className="rounded border-gray-300" />
                显示审批任务
              </label>
              <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                <input type="checkbox" checked={showMilestone} onChange={(e) => setShowMilestone(e.target.checked)} className="rounded border-gray-300" />
                仅显示里程碑
              </label>
              <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                <input type="checkbox" checked={showDependency} onChange={(e) => setShowDependency(e.target.checked)} className="rounded border-gray-300" />
                显示依赖
              </label>
              <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                <input type="checkbox" checked={autoExtend} onChange={(e) => setAutoExtend(e.target.checked)} className="rounded border-gray-300" />
                启用自动顺延
              </label>
            </div>

            {/* Timeline */}
            <div className="px-4 py-2 border-b border-gray-50 bg-gray-50/30">
              <div className="flex items-center gap-0 text-[10px] text-gray-400 relative h-6">
                {['2025.10.01', '2025.11.01', '2025.12.01', '2026.01.01', '2026.02.01', '2026.03.01', '2026.04.01', '2026.05.01'].map((date, i) => (
                  <div key={i} className="flex-1 text-center border-l border-gray-200 first:border-l-0">{date}</div>
                ))}
                <div className="absolute left-[12%] top-0 bottom-0 flex items-end">
                  <div className="bg-amber-400 h-2 w-[12%] rounded-l-sm absolute" />
                  <span className="text-[9px] text-amber-600 whitespace-nowrap absolute -top-3 left-0">阶段1-100%</span>
                </div>
                <div className="absolute left-[25%] top-0 bottom-0 flex items-end">
                  <div className="bg-blue-400 h-2 w-[18%] rounded-r-sm absolute" />
                  <span className="text-[9px] text-blue-600 whitespace-nowrap absolute -top-3 left-0">阶段2-90%</span>
                </div>
              </div>
            </div>

            {/* View Content */}
            <div className="flex-1 overflow-y-auto">
              {viewTab === 'basic' && <BasicView />}
              {viewTab === 'plan' && <PlanView tasks={planTasks} />}
              {viewTab === 'swimlane' && <SwimlaneView data={swimlaneData} />}
              {viewTab === 'gantt' && <GanttView tasks={ganttTasks} />}
            </div>

            <TaskQuickBar />
          </div>
        </div>
      </div>
    </div>
  );
}

function TreeNodeComponent({
  nodes, selectedId, onSelect, depth,
}: {
  nodes: TreeNode[]; selectedId?: string; onSelect: (node: TreeNode) => void; depth: number;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ 'cat2': true, 'p1': true, 's1': true, 's2': true });

  return (
    <>
      {nodes.map((node) => {
        const isExpanded = expanded[node.id];
        const hasChildren = node.children && node.children.length > 0;
        const isSelected = selectedId === node.id;

        return (
          <div key={node.id}>
            <button
              onClick={() => {
                onSelect(node);
                if (hasChildren) setExpanded((prev) => ({ ...prev, [node.id]: !prev[node.id] }));
              }}
              className={cn(
                'w-full flex items-center gap-1.5 py-1 px-2 text-sm transition-colors',
                isSelected ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              )}
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
              {hasChildren ? (
                isExpanded ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />
              ) : <span className="w-3 shrink-0" />}
              {node.type === 'folder' && <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              {(node.type === 'task' || node.type === 'stage') && node.progress === 100 && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
              {(node.type === 'task' || node.type === 'stage') && node.progress !== 100 && <Circle className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
              {node.type === 'project' && <Folder className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
              <span className="truncate">{node.name}</span>
              {node.progress !== undefined && (
                <span className="text-[10px] text-gray-400 shrink-0 ml-auto">{node.progress}%</span>
              )}
            </button>
            {hasChildren && isExpanded && (
              <TreeNodeComponent nodes={node.children!} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />
            )}
          </div>
        );
      })}
    </>
  );
}

function BasicView() {
  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <InfoItem icon={Folder} label="项目类型" value="业务/管理/改进" />
        <InfoItem icon={Users} label="参与人员" value="张晓菁、王虎、徐涛、郑传力" />
        <InfoItem icon={FileText} label="归档位置" value="2SA系列/比亚迪水冷" />
        <InfoItem icon={RefreshCw} label="依赖关系" value="阶段110-FS-Au" />
      </div>
      <div className="border-t border-gray-100 pt-3 grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-[11px] text-gray-400">计划工时</div>
          <div className="text-sm text-gray-800 font-medium">180h 00m</div>
        </div>
        <div className="text-center">
          <div className="text-[11px] text-gray-400">反馈工时</div>
          <div className="text-sm text-gray-800 font-medium">230h</div>
        </div>
        <div className="text-center">
          <div className="text-[11px] text-gray-400">核定工时</div>
          <div className="text-sm text-gray-800 font-medium">200h</div>
        </div>
      </div>
      <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-3">
        <InfoItem icon={Clock} label="计划工期" value="25.8.11 17:30 - 25.10.11 17:30" />
        <InfoItem icon={Flag} label="完成进度" value="70%" />
      </div>
      <div className="border-t border-gray-100 pt-3">
        <div className="text-xs text-gray-500 font-medium mb-2">附件文件</div>
        <div className="space-y-2">
          {[
            { name: '手动执行机构.dwg', status: '已发布' },
            { name: '手动执行机构.sldasm', status: '张晓菁 编辑中' },
            { name: '手动执行机构设计说明书.docx', status: '王虎 审批中' },
          ].map((file, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <File className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-gray-700 flex-1">{file.name}</span>
              <span className={cn('px-1.5 py-0.5 rounded text-[10px]', i === 0 ? 'bg-green-50 text-green-600' : i === 1 ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600')}>{file.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlanView({ tasks }: { tasks: PlanTask[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-12">阶段</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">名称</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">负责人</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">部门</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">计划工时</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">实际工时</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">完成进度</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">计划工期</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-12">交付物</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-12">里程碑</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task, i) => (
            <tr key={i} className={cn('border-b border-gray-50', i % 2 === 1 && 'bg-gray-50/30')}>
              <td className="px-3 py-2 text-xs text-gray-500">{task.phase}</td>
              <td className="px-3 py-2 text-xs font-medium text-gray-800">{task.name}</td>
              <td className="px-3 py-2 text-xs text-gray-600">{task.assignee}</td>
              <td className="px-3 py-2 text-xs text-gray-500">{task.dept}</td>
              <td className="px-3 py-2 text-xs text-gray-600">{task.planHours}</td>
              <td className="px-3 py-2 text-xs text-gray-600">{task.actualHours}</td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${task.progress}%` }} />
                  </div>
                  <span className="text-[11px] text-gray-500">{task.progress}%</span>
                </div>
              </td>
              <td className="px-3 py-2 text-[11px] text-gray-500">{task.duration}</td>
              <td className="px-3 py-2"><Eye className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-blue-500" /></td>
              <td className="px-3 py-2">{task.milestone ? <Flag className="w-3.5 h-3.5 text-blue-500" /> : <Flag className="w-3.5 h-3.5 text-gray-200" />}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SwimlaneView({ data }: { data: SwimlaneData }) {
  return (
    <div className="p-4 overflow-x-auto">
      <div className="min-w-[480px]">
        {/* Stage Headers */}
        <div className="flex mb-4">
          <div className="w-12 md:w-20 shrink-0" />
          {data.stages.map((stage, i) => (
            <div key={i} className="flex-1 text-center">
              <div className={cn('py-2 px-2 md:px-3 rounded-md text-xs font-medium mx-0.5 md:mx-1', stage.progress === 100 ? 'bg-blue-500 text-white' : stage.progress > 0 ? 'bg-blue-200 text-blue-800' : 'bg-gray-100 text-gray-500')}>
                {stage.name}
                <span className="ml-1 text-[10px]">({stage.progress}%)</span>
              </div>
            </div>
          ))}
        </div>
        {/* Review Nodes Row */}
        <div className="flex mb-4">
          <div className="w-12 md:w-20 shrink-0 text-[10px] text-gray-400 text-right pr-2 md:pr-3">评审节点</div>
          <div className="flex-1 relative h-6 flex items-center">
            {data.checkpoints.map((cp, i) => (
              <div key={i} className="absolute text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded" style={{ left: `${20 + i * 18}%` }}>
                {cp}
              </div>
            ))}
            {data.reviewNodes.map((tr, i) => (
              <div key={i} className="absolute text-[9px] text-gray-500 bg-gray-50 px-1 py-0.5 rounded" style={{ left: `${12 + i * 13}%` }}>
                {tr}
              </div>
            ))}
          </div>
        </div>
        {/* Swimlanes */}
        <div className="space-y-1">
          {data.lanes.map((lane, laneIdx) => (
            <div key={laneIdx} className="flex items-stretch">
              <div className="w-12 md:w-20 shrink-0 text-[11px] md:text-xs text-gray-600 font-medium pr-1 md:pr-2 flex items-center border-r border-gray-200">
                {lane.name}
              </div>
              <div className="flex-1 flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-2 border-b border-gray-50 min-h-[36px] flex-wrap">
                {lane.tasks.map((task, taskIdx) => {
                  const isDone = laneIdx < 2 || (laneIdx === 3 && taskIdx < 2);
                  const isActive = (laneIdx === 2) || (laneIdx === 3 && taskIdx >= 2);
                  return (
                    <div
                      key={taskIdx}
                      className={cn(
                        'flex items-center gap-1.5 px-2 py-1 rounded text-[11px] cursor-pointer hover:opacity-80 whitespace-nowrap',
                        isDone ? 'bg-blue-100 text-blue-700' : isActive ? 'bg-amber-100 text-amber-700' : 'bg-gray-50 text-gray-500'
                      )}
                    >
                      <span className={cn('w-2 h-2 rounded-full shrink-0', isDone ? 'bg-blue-500' : isActive ? 'bg-amber-500' : 'bg-gray-300')} />
                      {task}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GanttView({ tasks }: { tasks: GanttTask[] }) {
  return (
    <div className="flex overflow-x-auto">
      {/* Left Table - hidden on mobile */}
      <div className="hidden md:block w-[300px] shrink-0 border-r border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-12">阶段</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">名称</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">计划工期</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-14">完成度</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, i) => (
              <tr key={i} className={cn('border-b border-gray-50 h-10', i % 2 === 1 && 'bg-gray-50/30')}>
                <td className="px-3 py-2 text-xs text-gray-500 font-medium">{task.phase}</td>
                <td className="px-3 py-2 text-xs text-gray-800">{task.name}</td>
                <td className="px-3 py-2 text-[11px] text-gray-500">{task.duration}</td>
                <td className="px-3 py-2 text-xs text-gray-600">{task.progress}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Gantt Bars */}
      <div className="flex-1 min-w-0">
        <div className="min-w-[400px] md:min-w-[600px] relative">
          {/* Time Headers */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            {['10月', '11月', '12月', '1月', '2月', '3月', '4月', '5月'].map((m, i) => (
              <div key={i} className="flex-1 text-center text-[10px] text-gray-400 py-2 border-l border-gray-100">{m}</div>
            ))}
          </div>
          {/* Bars */}
          <div className="relative">
            {tasks.map((task, i) => (
              <div key={i} className="h-10 flex items-center border-b border-gray-50 relative">
                {/* Inline task name label on mobile */}
                <span className="md:hidden absolute left-1 text-[10px] text-gray-500 z-10 pointer-events-none">
                  {task.name}
                </span>
                <div
                  className={cn('h-5 rounded-sm relative group', task.progress === 100 ? 'bg-blue-400' : 'bg-blue-200')}
                  style={{ marginLeft: `${task.barOffset}%`, width: `${task.barWidth}%` }}
                >
                  <div
                    className={cn('h-full rounded-sm', task.progress === 100 ? 'bg-blue-500' : 'bg-blue-400')}
                    style={{ width: `${task.progress}%` }}
                  />
                  {/* Hover Tooltip */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {task.name} | 完成度 {task.progress}%
                  </div>
                </div>
              </div>
            ))}
            {/* Dependency Lines */}
            <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
              <line x1="15%" y1="20" x2="18%" y2="60" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 2" />
              <line x1="18%" y1="60" x2="25%" y2="140" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 2" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
      <div>
        <div className="text-[11px] text-gray-400">{label}</div>
        <div className="text-xs text-gray-700">{value}</div>
      </div>
    </div>
  );
}
