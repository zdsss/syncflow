'use client';

import React, { useState } from 'react';
import {
  Sun, Calendar, CalendarDays, Infinity, Bell, Clock, HelpCircle,
  AlertTriangle, Send, Star, CheckSquare, GitBranch, Stamp,
  RefreshCw, Flag, Search, Play, Eye, Pencil, MoreHorizontal,
  ChevronRight, ChevronDown, Folder, File, FileText, Users,
} from 'lucide-react';
import { taskStats, mockTasks, type Task } from '@/lib/mock-data';
import { Sidebar } from '@/components/shared/sidebar';
import { TopBar } from '@/components/shared/top-bar';
import { TaskQuickBar } from '@/components/shared/task-quick-bar';
import { cn } from '@/lib/utils';

const statIconMap: Record<string, React.ElementType> = {
  'sun': Sun, 'calendar': Calendar, 'calendar-days': CalendarDays,
  'infinity': Infinity, 'bell': Bell, 'clock': Clock,
  'help-circle': HelpCircle, 'alert-triangle': AlertTriangle, 'send': Send,
  'star': Star, 'check-square': CheckSquare, 'git-branch': GitBranch,
  'stamp': Stamp, 'refresh-cw': RefreshCw, 'flag': Flag,
};

export default function WorkspacePage() {
  const [selectedStat, setSelectedStat] = useState('all');
  const [taskFilter, setTaskFilter] = useState<'all' | 'todo' | 'done'>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = mockTasks.filter((task) => {
    if (taskFilter === 'todo') return task.status !== 'done';
    if (taskFilter === 'done') return task.status === 'done';
    return true;
  });

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <div className="flex flex-1 min-h-0">
          {/* Left: Task Categories */}
          <div className="w-[180px] border-r border-gray-200 bg-gray-50/50 shrink-0 overflow-y-auto">
            <div className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">任务一览</div>
            {taskStats.map((stat) => {
              const Icon = statIconMap[stat.icon] || CheckSquare;
              return (
                <button
                  key={stat.key}
                  onClick={() => setSelectedStat(stat.key)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors',
                    selectedStat === stat.key
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1 text-left truncate">{stat.label}</span>
                  <span className="text-xs text-gray-400">{stat.count}</span>
                </button>
              );
            })}
          </div>

          {/* Middle: Task List */}
          <div className={cn('flex flex-col min-w-0 transition-all', selectedTask ? 'w-[340px] shrink-0' : 'flex-1')}>
            {/* Search & Filter */}
            <div className="px-4 py-3 border-b border-gray-100 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">综合查询</span>
                <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-2 py-1">
                  <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="输入任务名称、类型、负责人、项目名称等属性..."
                    className="flex-1 min-w-0 bg-transparent text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-1">
                {(['all', 'todo', 'done'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTaskFilter(filter)}
                    className={cn(
                      'px-3 py-1 text-sm rounded-sm transition-colors',
                      taskFilter === filter
                        ? 'text-blue-600 border-b-2 border-blue-500 font-medium'
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    {filter === 'all' ? '全部' : filter === 'todo' ? '未完成' : '已完成'}
                  </button>
                ))}
              </div>
            </div>

            {/* Task Cards */}
            <div className="flex-1 overflow-y-auto">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors',
                    selectedTask?.id === task.id ? 'bg-blue-50/60' : 'hover:bg-gray-50'
                  )}
                >
                  <button
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0',
                      task.status === 'done'
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300 hover:border-blue-400'
                    )}
                  >
                    {task.status === 'done' && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800 truncate">{task.name}</span>
                      <span className="text-xs text-blue-500 shrink-0">{task.progress}%</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 truncate">
                      {task.projectName} · @{task.assignees.map(a => a.name).join(' ')}
                    </div>
                    <div className="text-xs text-gray-300 mt-0.5">{task.createdAt}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-blue-500 rounded">
                      <Play className="w-3.5 h-3.5" />
                    </button>
                    <button className={cn('w-6 h-6 flex items-center justify-center rounded', task.isWatched ? 'text-blue-500' : 'text-gray-300 hover:text-blue-500')}>
                      <Star className="w-3.5 h-3.5" fill={task.isWatched ? 'currentColor' : 'none'} />
                    </button>
                    <button className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-blue-500 rounded">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <TaskQuickBar />
          </div>

          {/* Right: Task Detail */}
          {selectedTask && (
            <div className="w-[320px] border-l border-gray-200 bg-white overflow-y-auto shrink-0 animate-in slide-in-from-right duration-200">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-800">{selectedTask.name}</h3>
                  <span className="text-xs text-blue-500">{selectedTask.progress}%</span>
                </div>
              </div>
              <div className="px-4 py-3 space-y-3">
                <DetailRow icon={CheckSquare} label="任务类型" value={selectedTask.type} />
                <DetailRow icon={Folder} label="所属项目" value={selectedTask.projectName} />
                <DetailRow icon={Users} label="参与人员" value={`@${selectedTask.assignees.map(a => a.name).join(' ')}`} />
                {selectedTask.reminder && <DetailRow icon={Bell} label="提醒策略" value={selectedTask.reminder} />}
                {selectedTask.archiveLocation && <DetailRow icon={FileText} label="归档位置" value={selectedTask.archiveLocation} />}
                {selectedTask.dependencies && selectedTask.dependencies.length > 0 && (
                  <DetailRow icon={RefreshCw} label="依赖关系" value={selectedTask.dependencies.map(d => `${d.taskId}-${d.type}`).join('、')} />
                )}
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">计划工时</span>
                    <span className="text-gray-700">{selectedTask.plannedHours}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">反馈工时</span>
                    <span className="text-gray-700">{selectedTask.feedbackHours}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">核定工时</span>
                    <span className="text-gray-700">{selectedTask.approvedHours}</span>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">计划工期</span>
                    <span className="text-gray-700 text-[11px]">{selectedTask.plannedDuration}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">完成进度</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${selectedTask.progress}%` }} />
                      </div>
                      <span className="text-gray-700">{selectedTask.progress}%</span>
                    </div>
                  </div>
                  {selectedTask.actualEnd && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">实际结束</span>
                      <span className="text-gray-700">{selectedTask.actualEnd}</span>
                    </div>
                  )}
                </div>
                {/* Attachments */}
                {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                  <div className="border-t border-gray-100 pt-3">
                    <div className="text-xs text-gray-500 font-medium mb-2">附件文件</div>
                    {selectedTask.attachments.map((att) => (
                      <div key={att.id} className="flex items-center gap-2 py-1.5">
                        <File className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-700 truncate">{att.name}</div>
                          <div className="text-[10px] text-gray-400">{att.size} · {att.date} · {att.status} · {att.operator}</div>
                        </div>
                        <button className="text-gray-300 hover:text-red-400">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <span className="text-[11px] text-gray-400">{label}</span>
        <p className="text-xs text-gray-700 break-all">{value}</p>
      </div>
    </div>
  );
}
