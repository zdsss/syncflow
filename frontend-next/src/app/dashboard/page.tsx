'use client';

import React from 'react';
import { Sidebar } from '@/components/shared/sidebar';
import { TopBar } from '@/components/shared/top-bar';
import { dashboardData } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        {/* Override top bar for dark theme */}
        <header className="h-11 flex items-center justify-between px-4 border-b border-slate-700 bg-slate-800 shrink-0">
          <span className="text-sm font-medium text-slate-400">超简协同项目管理系统 - 中控看板</span>
          <div className="flex items-center gap-2">
            <button className="text-slate-500 hover:text-slate-300 text-xs">全屏</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-0">
            {/* Left Column */}
            <div className="space-y-4">
              <DashboardCard title="在建项目" value={dashboardData.activeProjects} />
              <DashboardCard title="完工任务" value={dashboardData.completedTasks} />
              <DashboardCard title="超期任务" value={dashboardData.overdueTasks} alert />
              <DashboardCard title="风险" value={dashboardData.risks} alert />
            </div>

            {/* Middle Column */}
            <div className="space-y-4">
              <DashboardCard title="当期任务" value={dashboardData.currentTasks} />
              <DashboardCard title="下期任务" value={dashboardData.nextTasks} />
              <DashboardCard title="在途问题" value={dashboardData.inTransitIssues} />
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-300 mb-3">计划工时排行</h3>
                <div className="space-y-2">
                  {dashboardData.hoursRanking.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold', i < 3 ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-400')}>
                        {i + 1}
                      </span>
                      <span className="text-xs text-slate-300 flex-1">{item.name}</span>
                      <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(item.hours / 68) * 100}%` }} />
                      </div>
                      <span className="text-xs text-slate-400 w-8 text-right">{item.hours}h</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-300 mb-3">按期完工率排行</h3>
                <div className="space-y-2">
                  {dashboardData.onTimeRate.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-slate-300 flex-1">{item.name}</span>
                      <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${item.rate}%` }} />
                      </div>
                      <span className="text-xs text-slate-400 w-8 text-right">{item.rate}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-300 mb-3">在途活动</h3>
                <div className="text-xs text-slate-500 text-center py-6">暂无数据</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ title, value, alert }: { title: string; value: number; alert?: boolean }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <h3 className="text-sm font-medium text-slate-400 mb-1">{title}</h3>
      <div className={cn('text-3xl font-bold', alert ? 'text-red-400' : 'text-white')}>{value}</div>
    </div>
  );
}
