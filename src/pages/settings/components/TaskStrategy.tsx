import { useState } from 'react';
import { Radio, InputNumber, Button, message, Space } from 'antd';
import type { RadioChangeEvent } from 'antd';
import styles from './TaskStrategy.module.css';

type TimeSpanValue = 'all' | '3m' | '6m' | '1y' | 'custom';
type WarningTimeValue = '1h' | '4h' | '8h' | 'custom';
type EscalationLevel = 1 | 2 | 3 | 'unlimited';

export interface TaskStrategyConfig {
  allTimeSpan: TimeSpanValue;
  allTimeSpanCustom?: number;
  issueTimeSpan: TimeSpanValue;
  issueTimeSpanCustom?: number;
  riskTimeSpan: TimeSpanValue;
  riskTimeSpanCustom?: number;
  suggestionTimeSpan: TimeSpanValue;
  suggestionTimeSpanCustom?: number;
  changeTimeSpan: TimeSpanValue;
  changeTimeSpanCustom?: number;
  watchTimeSpan: TimeSpanValue;
  watchTimeSpanCustom?: number;
  warningAdvanceTime: WarningTimeValue;
  warningAdvanceTimeCustom?: number;
  taskOverdueEscalationLevel: EscalationLevel;
  milestoneOverdueEscalationLevel: EscalationLevel;
}

const defaultConfig: TaskStrategyConfig = {
  allTimeSpan: '6m',
  issueTimeSpan: '3m',
  riskTimeSpan: '3m',
  suggestionTimeSpan: '3m',
  changeTimeSpan: '3m',
  watchTimeSpan: '3m',
  warningAdvanceTime: '1h',
  taskOverdueEscalationLevel: 2,
  milestoneOverdueEscalationLevel: 2,
};

const timeSpanOptions = [
  { label: '全部', value: 'all' },
  { label: '三个月', value: '3m' },
  { label: '六个月', value: '6m' },
  { label: '一年', value: '1y' },
  { label: '自定义', value: 'custom' },
];

const warningTimeOptions = [
  { label: '提前1h', value: '1h' },
  { label: '提前4h', value: '4h' },
  { label: '提前8h', value: '8h' },
  { label: '自定义', value: 'custom' },
];

const escalationOptions = [
  { label: '1级', value: 1 },
  { label: '2级', value: 2 },
  { label: '3级', value: 3 },
  { label: '无限级', value: 'unlimited' },
];

interface TimeSpanRowProps {
  label: string;
  field: keyof TaskStrategyConfig;
  customField: keyof TaskStrategyConfig;
  customUnit: string;
  config: TaskStrategyConfig;
  onChange: (field: keyof TaskStrategyConfig, value: TimeSpanValue | number | undefined) => void;
}

function TimeSpanRow({ label, field, customField, customUnit, config, onChange }: TimeSpanRowProps) {
  const value = config[field] as TimeSpanValue;
  return (
    <tr data-testid={`row-${field}`}>
      <td className={styles.rowLabel}>{label}</td>
      <td>
        <Space>
          <Radio.Group
            value={value}
            onChange={(e: RadioChangeEvent) => onChange(field, e.target.value)}
            data-testid={`radio-${field}`}
          >
            {timeSpanOptions.map((opt) => (
              <Radio key={opt.value} value={opt.value}>{opt.label}</Radio>
            ))}
          </Radio.Group>
          {value === 'custom' && (
            <Space size={4}>
              <InputNumber
                min={1}
                value={config[customField] as number | undefined}
                onChange={(v) => onChange(customField, v ?? undefined)}
                style={{ width: 70 }}
                data-testid={`input-${customField}`}
              />
              <span className={styles.unit}>{customUnit}</span>
            </Space>
          )}
        </Space>
      </td>
    </tr>
  );
}

export default function TaskStrategy() {
  const [config, setConfig] = useState<TaskStrategyConfig>(defaultConfig);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange = (field: keyof TaskStrategyConfig, value: TimeSpanValue | WarningTimeValue | EscalationLevel | number | undefined) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // PUT /api/user/task-strategy — backend not yet implemented, optimistic save
      await Promise.resolve();
      message.success('任务策略已保存');
      setDirty(false);
    } catch {
      message.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container} data-testid="task-strategy">
      <h2 className={styles.title}>任务策略</h2>
      <table className={styles.table}>
        <tbody>
          <TimeSpanRow
            label="全部的时间跨度"
            field="allTimeSpan"
            customField="allTimeSpanCustom"
            customUnit="月"
            config={config}
            onChange={handleChange}
          />
          <TimeSpanRow
            label="问题的时间跨度"
            field="issueTimeSpan"
            customField="issueTimeSpanCustom"
            customUnit="周"
            config={config}
            onChange={handleChange}
          />
          <TimeSpanRow
            label="风险的时间跨度"
            field="riskTimeSpan"
            customField="riskTimeSpanCustom"
            customUnit="周"
            config={config}
            onChange={handleChange}
          />
          <TimeSpanRow
            label="建议的时间跨度"
            field="suggestionTimeSpan"
            customField="suggestionTimeSpanCustom"
            customUnit="周"
            config={config}
            onChange={handleChange}
          />
          <TimeSpanRow
            label="变更的时间跨度"
            field="changeTimeSpan"
            customField="changeTimeSpanCustom"
            customUnit="周"
            config={config}
            onChange={handleChange}
          />
          <TimeSpanRow
            label="关注的时间跨度"
            field="watchTimeSpan"
            customField="watchTimeSpanCustom"
            customUnit="周"
            config={config}
            onChange={handleChange}
          />
          <tr data-testid="row-warningAdvanceTime">
            <td className={styles.rowLabel}>预警最发时间点</td>
            <td>
              <Space>
                <Radio.Group
                  value={config.warningAdvanceTime}
                  onChange={(e: RadioChangeEvent) => handleChange('warningAdvanceTime', e.target.value)}
                  data-testid="radio-warningAdvanceTime"
                >
                  {warningTimeOptions.map((opt) => (
                    <Radio key={opt.value} value={opt.value}>{opt.label}</Radio>
                  ))}
                </Radio.Group>
                {config.warningAdvanceTime === 'custom' && (
                  <Space size={4}>
                    <InputNumber
                      min={1}
                      value={config.warningAdvanceTimeCustom}
                      onChange={(v) => handleChange('warningAdvanceTimeCustom', v ?? undefined)}
                      style={{ width: 70 }}
                      data-testid="input-warningAdvanceTimeCustom"
                    />
                    <span className={styles.unit}>h</span>
                  </Space>
                )}
              </Space>
            </td>
          </tr>
          <tr data-testid="row-taskOverdueEscalationLevel">
            <td className={styles.rowLabel}>任务逾期向上报警的级数</td>
            <td>
              <Radio.Group
                value={config.taskOverdueEscalationLevel}
                onChange={(e: RadioChangeEvent) => handleChange('taskOverdueEscalationLevel', e.target.value)}
                data-testid="radio-taskOverdueEscalationLevel"
              >
                {escalationOptions.map((opt) => (
                  <Radio key={String(opt.value)} value={opt.value}>{opt.label}</Radio>
                ))}
              </Radio.Group>
            </td>
          </tr>
          <tr data-testid="row-milestoneOverdueEscalationLevel">
            <td className={styles.rowLabel}>里程碑逾期向上报警的级数</td>
            <td>
              <Radio.Group
                value={config.milestoneOverdueEscalationLevel}
                onChange={(e: RadioChangeEvent) => handleChange('milestoneOverdueEscalationLevel', e.target.value)}
                data-testid="radio-milestoneOverdueEscalationLevel"
              >
                {escalationOptions.map((opt) => (
                  <Radio key={String(opt.value)} value={opt.value}>{opt.label}</Radio>
                ))}
              </Radio.Group>
            </td>
          </tr>
        </tbody>
      </table>
      {dirty && (
        <div className={styles.saveBar}>
          <Button type="primary" loading={saving} onClick={handleSave} data-testid="save-strategy-btn">
            保存
          </Button>
        </div>
      )}
    </div>
  );
}
