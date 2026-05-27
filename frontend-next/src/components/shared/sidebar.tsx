'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FolderKanban, Monitor, FileText, Table2,
  Cog, Settings2, BarChart2, Wrench, Bookmark, GitMerge, User,
  ChevronLeft, Users, Bell,
} from 'lucide-react';
import { currentUser, navItems } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';

const iconMap: Record<string, React.ElementType> = {
  'layout-dashboard': LayoutDashboard,
  'folder-kanban': FolderKanban,
  'monitor': Monitor,
  'file-text': FileText,
  'table-2': Table2,
  'cog': Cog,
  'settings-2': Settings2,
  'bar-chart-2': BarChart2,
  'wrench': Wrench,
  'bookmark': Bookmark,
  'git-merge': GitMerge,
  'user': User,
};

const routeMap: Record<string, string> = {
  workspace: '/workspace',
  project: '/project',
  dashboard: '/dashboard',
  files: '/files',
  bom: '/bom',
  config: '/config',
};

/** Shared sidebar content used by both desktop and mobile sidebars */
function SidebarContent({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* User Info */}
      <div className={cn('flex items-center gap-2 px-3 py-4 border-b border-gray-100', collapsed && 'justify-center')}>
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium shrink-0">
          {currentUser.name.charAt(0)}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{currentUser.name}</p>
            <p className="text-xs text-gray-400 truncate">{currentUser.phone}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const href = routeMap[item.key] || '/';
          const isActive = pathname === href || (href !== '/' && pathname?.startsWith(href));

          return (
            <Link
              key={item.key}
              href={href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-4 py-2 mx-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              )}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

/** Desktop sidebar - hidden on mobile, collapsible on desktop */
export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'h-screen hidden md:flex flex-col border-r border-gray-200 bg-white transition-all duration-300 shrink-0',
        collapsed ? 'w-16' : 'w-[220px]'
      )}
    >
      <SidebarContent collapsed={collapsed} />

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 bg-gray-800 text-white hover:bg-gray-700 transition-colors"
      >
        <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
      </button>
    </aside>
  );
}

/** Mobile sidebar - renders as a Sheet/drawer overlay */
export function MobileSidebar({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[260px] p-0 flex flex-col">
        <SheetTitle className="sr-only">导航菜单</SheetTitle>
        <SidebarContent onNavigate={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}
