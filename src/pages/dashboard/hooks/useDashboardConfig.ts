import { useState, useCallback } from 'react';

const CONFIG_KEY = 'dashboardConfig';

export interface DashboardConfig {
  defaultView: string;
  defaultDateRange: string;
  kanbanColumns: string[];
  ganttStartYear: number;
  showNotifications: boolean;
}

export const DEFAULT_CONFIG: DashboardConfig = {
  defaultView: 'schedule',
  defaultDateRange: 'month',
  kanbanColumns: ['todo', 'in_progress', 'done', 'pending', 'approved', 'rejected'],
  ganttStartYear: new Date().getFullYear(),
  showNotifications: true,
};

function loadConfig(): DashboardConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_CONFIG };
}

export function useDashboardConfig() {
  const [config, setConfig] = useState<DashboardConfig>(loadConfig);

  const saveConfig = useCallback((next: DashboardConfig) => {
    setConfig(next);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
  }, []);

  const resetConfig = useCallback(() => {
    saveConfig({ ...DEFAULT_CONFIG });
  }, [saveConfig]);

  const reloadConfig = useCallback(() => {
    setConfig(loadConfig());
  }, []);

  return { config, saveConfig, resetConfig, reloadConfig };
}
