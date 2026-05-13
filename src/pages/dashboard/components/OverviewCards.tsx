import { Row, Col, Card, Statistic, Skeleton, Empty } from 'antd';
import {
  ProjectOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';

export interface ProjectOverviewData {
  totalProjects: number;
  inProgress: number;
  completed: number;
  delayed: number;
}

interface OverviewCardsProps {
  data: ProjectOverviewData | null;
  loading?: boolean;
}

export default function OverviewCards({ data, loading }: OverviewCardsProps) {
  if (loading) {
    return (
      <Card title="项目总览" data-testid="overview-cards">
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

  if (!data) {
    return (
      <Card title="项目总览" data-testid="overview-cards">
        <Empty description="暂无数据" />
      </Card>
    );
  }

  return (
    <Card title="项目总览" data-testid="overview-cards">
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={12} md={6}>
          <Statistic
            title="项目总数"
            value={data.totalProjects}
            prefix={<ProjectOutlined style={{ color: '#1890ff' }} />}
            data-testid="stat-total-projects"
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Statistic
            title="进行中"
            value={data.inProgress}
            prefix={<SyncOutlined style={{ color: '#faad14' }} />}
            data-testid="stat-in-progress"
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Statistic
            title="已完成"
            value={data.completed}
            prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            data-testid="stat-completed"
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Statistic
            title="延期"
            value={data.delayed}
            prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
            styles={{ content: { color: data.delayed > 0 ? '#ff4d4f' : undefined } }}
            data-testid="stat-delayed"
          />
        </Col>
      </Row>
    </Card>
  );
}
