import { Drawer, Button, Form, Radio, Select, Checkbox, InputNumber, Switch } from 'antd';
import type { DashboardConfig } from '../hooks/useDashboardConfig';

interface ConfigDrawerProps {
  open: boolean;
  config: DashboardConfig;
  onClose: () => void;
  onReset: () => void;
  onSave: (config: DashboardConfig) => void;
}

export default function ConfigDrawer({ open, config, onClose, onReset, onSave }: ConfigDrawerProps) {
  return (
    <Drawer
      title="看板配置"
      placement="right"
      size={400}
      open={open}
      onClose={onClose}
      extra={
        <Button onClick={onReset}>恢复默认</Button>
      }
    >
      <Form layout="vertical">
        <Form.Item label="默认视图">
          <Radio.Group
            value={config.defaultView}
            onChange={(e) => onSave({ ...config, defaultView: e.target.value })}
          >
            <Radio value="schedule">排期视图</Radio>
            <Radio value="kanban">看板视图</Radio>
            <Radio value="department">部门甘特图</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="默认日期范围">
          <Select
            data-testid="config-date-range-select"
            value={config.defaultDateRange}
            onChange={(val) => onSave({ ...config, defaultDateRange: val })}
            options={[
              { value: 'month', label: '本月' },
              { value: 'quarter', label: '本季度' },
              { value: 'year', label: '本年' },
              { value: 'custom', label: '自定义' },
            ]}
          />
        </Form.Item>
        <Form.Item label="看板显示列">
          <Checkbox.Group
            value={config.kanbanColumns}
            onChange={(vals) => onSave({ ...config, kanbanColumns: vals as string[] })}
            options={[
              { value: 'todo', label: 'To do' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'done', label: 'Done' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
        </Form.Item>
        <Form.Item label="甘特图起始年份">
          <div data-testid="config-gantt-year-input">
            <InputNumber
              value={config.ganttStartYear}
              onChange={(val) => { if (val) onSave({ ...config, ganttStartYear: val }); }}
              min={2000}
              max={2100}
              style={{ width: '100%' }}
            />
          </div>
        </Form.Item>
        <Form.Item label="显示通知提醒">
          <div data-testid="config-notifications-switch">
            <Switch
              checked={config.showNotifications}
              onChange={(checked) => onSave({ ...config, showNotifications: checked })}
            />
          </div>
        </Form.Item>
      </Form>
    </Drawer>
  );
}
