import { Button, Select } from 'antd';
import styles from './QueryPage.module.css';
import type { TaskItem } from './TaskList';

interface ProcessRecord {
  id: string;
  action: string;
  time: string;
}

interface Participant {
  id: string;
  name: string;
  role: string;
}

const MOCK_RECORDS: ProcessRecord[] = [
  { id: '1', action: '邓智豪 创建了任务', time: '2026-05-01 09:30' },
  { id: '2', action: '李明 分配了负责人', time: '2026-05-01 10:15' },
  { id: '3', action: '王芳 更新了进度', time: '2026-05-02 14:00' },
];

const MOCK_PARTICIPANTS: Participant[] = [
  { id: '1', name: '邓智豪', role: '负责人' },
  { id: '2', name: '李明', role: '参与人' },
  { id: '3', name: '王芳', role: '参与人' },
];

interface TaskDetailPanelProps {
  selectedTask?: TaskItem | null;
}

export default function TaskDetailPanel({ selectedTask }: TaskDetailPanelProps) {
  return (
    <aside
      className={styles.detailPanel}
      data-testid="task-detail-panel"
      data-selected-task={selectedTask?.code || ''}
    >
      <div className={styles.detailHeader}>
        <h3 className={styles.detailTitle}>{selectedTask ? selectedTask.name : '任务详情'}</h3>
        <div className={styles.businessTypeRow}>
          <span className={styles.businessTypeLabel}>业务类型</span>
          <Select
            className={styles.businessTypeSelect}
            data-testid="business-type-select"
            placeholder="请选择"
            options={[
              { value: 'design', label: '设计类' },
              { value: 'process', label: '工艺类' },
              { value: 'quality', label: '品质类' },
              { value: 'test', label: '测试类' },
            ]}
          />
        </div>
        <div className={styles.actionButtons}>
          <Button size="small" type="primary">选择流程</Button>
          <Button size="small">流程记录</Button>
          <Button size="small">设置参与人</Button>
          <Button size="small">标记重要</Button>
          <Button size="small" type="primary" ghost>完成任务</Button>
        </div>
      </div>

      <div className={styles.detailContent}>
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>流程选择</h4>
          <Select
            className={styles.templateSelect}
            placeholder="请选择流程模板"
            options={[
              { value: 'standard', label: '标准流程' },
              { value: 'urgent', label: '紧急流程' },
              { value: 'review', label: '评审流程' },
            ]}
          />
          <p className={styles.templateHint}>选择一个流程模板以启动任务流程</p>
        </div>

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>流程记录</h4>
          {selectedTask ? MOCK_RECORDS.map((record) => (
            <div key={record.id} className={styles.processRecord}>
              <span className={styles.processDot} />
              <div className={styles.processInfo}>
                <div className={styles.processAction}>{record.action}</div>
                <div className={styles.processTime}>{record.time}</div>
              </div>
            </div>
          )) : <div className={styles.emptyDetail}><span>暂无流程记录</span></div>}
        </div>

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>参与人设置</h4>
          {selectedTask ? MOCK_PARTICIPANTS.map((p) => (
            <div key={p.id} className={styles.participantItem}>
              <span className={styles.participantAvatar}>{p.name[0]}</span>
              <span className={styles.participantName}>{p.name}</span>
              <span className={styles.participantRole}>{p.role}</span>
            </div>
          )) : <div className={styles.emptyDetail}><span>暂无参与人</span></div>}
        </div>
      </div>

      <div className={styles.detailNavigation} data-testid="detail-navigation">
        <Button size="small">上一步</Button>
        <Button size="small">全部</Button>
        <Button size="small">下一步</Button>
      </div>
    </aside>
  );
}
