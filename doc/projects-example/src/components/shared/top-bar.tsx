'use client';

import React from 'react';
import { Users, Settings } from 'lucide-react';

export function TopBar() {
  return (
    <header className="h-11 flex items-center justify-between px-4 border-b border-gray-200 bg-white shrink-0">
      <div className="flex items-center gap-3">
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
  );
}
