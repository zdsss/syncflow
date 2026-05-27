'use client';

import React, { useState } from 'react';
import {
  AtSign, Clock, CalendarDays, Percent, Type, Bell, Link2, FileStack,
  Plus, Users, Settings,
} from 'lucide-react';

export function TaskQuickBar() {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      // TODO: 后端接口 - POST /api/tasks 创建任务
      // const response = await fetch('/api/tasks', { method: 'POST', body: JSON.stringify({ name: inputValue }) });
      setInputValue('');
    }
  };

  const quickActions = [
    { icon: AtSign, label: '参与人', trigger: '@' },
    { icon: Clock, label: '工时', trigger: '#' },
    { icon: CalendarDays, label: '工期', trigger: '¥' },
    { icon: Percent, label: '类型', trigger: '%' },
    { icon: Bell, label: '提醒' },
    { icon: Type, label: '编辑' },
    { icon: Link2, label: '依赖', trigger: '^' },
    { icon: FileStack, label: '模板', trigger: '*' },
  ];

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t border-gray-200 bg-white shrink-0">
      <button className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors shrink-0">
        <Plus className="w-4 h-4" />
      </button>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="输入任务名称，@参与人 #工时 ¥工期 %类型 ^依赖 *模板"
        className="flex-1 min-w-0 px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
      />
      <div className="flex items-center gap-1">
        {quickActions.map((action) => (
          <button
            key={action.label}
            title={action.label}
            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
          >
            <action.icon className="w-[16px] h-[16px]" />
          </button>
        ))}
      </div>
    </div>
  );
}
