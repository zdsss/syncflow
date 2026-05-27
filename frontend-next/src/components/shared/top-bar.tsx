'use client';

import React, { useState } from 'react';
import { Users, Settings, Menu } from 'lucide-react';
import { MobileSidebar } from '@/components/shared/sidebar';

export function TopBar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="h-11 flex items-center justify-between px-4 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <button
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-blue-500 rounded transition-colors md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="打开导航菜单"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-gray-400">超简协同项目管理系统</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-500 rounded transition-colors">
            <Users className="w-[18px] h-[18px]" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-500 rounded transition-colors">
            <Settings className="w-[18px] h-[18px]" />
          </button>
        </div>
      </header>
      <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />
    </>
  );
}
