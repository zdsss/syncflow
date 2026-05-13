import { Row, Col, Card, Statistic, Skeleton } from 'antd';
import {
  CalendarOutlined,
  ScheduleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

interface TaskSummaryData {
  todayTasks: number;
  weekTasks: number;
  warningTasks: number;
  overdueTasks: number;
}

interface TaskSummaryCardsProps {
  data: TaskSummaryData;
  loading?: boolean;
}

const EMPTY_DATA: TaskSummaryData = {
  todayTasks: 0,
  weekTasks: 0,
  warningTasks: 0,
  overdueTasks: 0,
};

export default function TaskSummaryCards({ data, loading }: TaskSummaryCardsProps) {
  const safeData = data || EMPTY_DATA;

  if (loading) {
    return (
      <Card title="任务统计" data-testid="task-summary-cards">
        <Row gutter={[12, 12]}>
          {[0, 1, 2, 3].map((i) => (
            <Col xs={12} sm={12} md={6} key={i}>
              <Skeleton active paragraph={{ rows: 1 }} />
            </Col>
          ))}
        </Row>
      </Card>
    );
  }

  return (
    <Card title="任务统计" data-testid="task-summary-cards">
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={12} md={6}>
          <Statistic
            title="今日任务"
            value={safeData.todayTasks}
            prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
            data-testid="stat-today"
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Statistic
            title="本周任务"
            value={safeData.weekTasks}
            prefix={<ScheduleOutlined style={{ color: '#1890ff' }} />}
            data-testid="stat-week"
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Statistic
            title="预警任务"
            value={safeData.warningTasks}
            prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
            styles={{ content: { color: safeData.warningTasks > 0 ? '#faad14' : undefined } }}
            data-testid="stat-warning"
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Statistic
            title="逾期任务"
            value={safeData.overdueTasks}
            prefix={<ClockCircleOutlined style={{ color: '#ff4d4f' }} />}
            styles={{ content: { color: safeData.overdueTasks > 0 ? '#ff4d4f' : undefined } }}
            data-testid="stat-overdue"
          />
        </Col>
      </Row>
    </Card>
  );
}
