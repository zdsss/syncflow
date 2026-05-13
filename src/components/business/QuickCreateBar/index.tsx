import { useState, useCallback, useRef } from 'react';
import { Input, Button, message } from 'antd';
import {
  UserOutlined,
  FieldTimeOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useTaskStore } from '@/stores/useTaskStore';
import styles from './QuickCreateBar.module.css';
import {
  AssigneePicker,
  BudgetPicker,
  TypePicker,
  TaskTemplatePicker,
  ProjectPicker,
  DeliverablePicker,
  TemplatePicker,
} from './pickers';
import type { PickerProps } from './pickers';

// Characters that trigger popups
const SPECIAL_CHARS = ['@', '￥', '$', '%', '^', '#', '*', '&'] as const;

type TriggerChar = (typeof SPECIAL_CHARS)[number];

const TRIGGER_LABELS: Record<TriggerChar, string> = {
  '@': '选择负责人',
  '￥': '设置工时',
  $: '设置工时',
  '%': '选择任务类型',
  '^': '选择任务模板',
  '#': '选择项目',
  '*': '选择交付物模板',
  '&': '选择工作流模板',
};

const PICKER_MAP: Record<TriggerChar, React.ComponentType<PickerProps>> = {
  '@': AssigneePicker,
  '￥': BudgetPicker,
  $: BudgetPicker,
  '%': TypePicker,
  '^': TaskTemplatePicker,
  '#': ProjectPicker,
  '*': DeliverablePicker,
  '&': TemplatePicker,
};

function getSearchQuery(text: string, trigger: TriggerChar): string {
  const idx = text.lastIndexOf(trigger);
  if (idx === -1) return '';
  return text.slice(idx + 1);
}

interface QuickCreateBarProps {
  onCreateSuccess?: () => void;
  projectId?: number;
}

export default function QuickCreateBar({ onCreateSuccess, projectId }: QuickCreateBarProps) {
  const [value, setValue] = useState('');
  const [activeTrigger, setActiveTrigger] = useState<TriggerChar | null>(null);
  const inputRef = useRef<any>(null);
  const { quickCreate } = useTaskStore();

  // Detect the last special character typed
  const detectTrigger = useCallback((text: string): TriggerChar | null => {
    const lastChar = text[text.length - 1] as TriggerChar;
    if (SPECIAL_CHARS.includes(lastChar)) {
      return lastChar;
    }
    // Also detect when typing after a special char (space closes the popup)
    for (const ch of SPECIAL_CHARS) {
      const idx = text.lastIndexOf(ch);
      if (idx !== -1) {
        const afterChar = text.slice(idx + 1);
        if (!afterChar.includes(' ')) {
          return ch as TriggerChar;
        }
      }
    }
    return null;
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      const trigger = detectTrigger(newValue);
      setActiveTrigger(trigger);
    },
    [detectTrigger]
  );

  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.nativeEvent.isComposing && value.trim()) {
        e.preventDefault();
        try {
          await quickCreate({ input: value.trim(), projectId });
          setValue('');
          setActiveTrigger(null);
          message.success('任务创建成功');
          onCreateSuccess?.();
        } catch {
          message.error('任务创建失败');
        }
      }
    },
    [value, quickCreate, onCreateSuccess, projectId]
  );

  const handlePickerSelect = useCallback(
    (trigger: TriggerChar, selected: string) => {
      const idx = value.lastIndexOf(trigger);
      if (idx !== -1) {
        const prefix = value.slice(0, idx);
        const query = value.slice(idx + 1);
        // Remove trigger + query, append selected value
        // Add a space separator if the prefix is non-empty and doesn't end with space
        const separator = prefix.length > 0 && !prefix.endsWith(' ') ? ' ' : '';
        setValue(`${prefix}${separator}${selected} `);
      }
      setActiveTrigger(null);
    },
    [value]
  );

  const PickerComponent = activeTrigger ? PICKER_MAP[activeTrigger] : null;
  const searchQuery = activeTrigger ? getSearchQuery(value, activeTrigger) : '';

  return (
    <div className={styles.bar} data-testid="quick-create-bar">
      {activeTrigger && PickerComponent && (
        <div className={styles.popup} data-testid="trigger-popup">
          <PickerComponent
            searchQuery={searchQuery}
            onSelect={(selected) => handlePickerSelect(activeTrigger, selected)}
            onClose={() => setActiveTrigger(null)}
          />
        </div>
      )}
      <div className={styles.inputRow}>
        <Input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="快速创建任务... (支持 @负责人 #项目 %类型 等快捷输入)"
          className={styles.input}
          data-testid="quick-create-input"
          allowClear
        />
        <div className={styles.actions}>
          <Button
            type="text"
            icon={<UserOutlined />}
            title="负责人"
            data-testid="btn-assignee"
            onClick={() => {
              setValue((v) => v + '@');
              setActiveTrigger('@');
              inputRef.current?.focus();
            }}
          />
          <Button
            type="text"
            icon={<FieldTimeOutlined />}
            title="工时"
            data-testid="btn-hours"
            onClick={() => {
              setValue((v) => v + '￥');
              setActiveTrigger('￥');
              inputRef.current?.focus();
            }}
          />
          <Button
            type="text"
            icon={<FileTextOutlined />}
            title="模板"
            data-testid="btn-template"
            onClick={() => {
              setValue((v) => v + '&');
              setActiveTrigger('&');
              inputRef.current?.focus();
            }}
          />
        </div>
      </div>
    </div>
  );
}
