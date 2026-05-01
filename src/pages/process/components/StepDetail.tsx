import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import styles from '../ProcessPage.module.css';

interface ProcessStep {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  parameters?: any;
}

interface ProcessRoute {
  id: string;
  name: string;
  description?: string;
  status: string;
  version: number;
  steps: ProcessStep[];
}

interface StepDetailProps {
  route: ProcessRoute | null;
  onAddStep: (routeId: string) => void;
}

export default function StepDetail({ route, onAddStep }: StepDetailProps) {
  if (!route) {
    return <div className={styles.emptyHint}>请选择一个工艺路线</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ margin: 0 }}>{route.name}</h4>
        {route.description && (
          <p style={{ margin: '4px 0 0', color: '#999', fontSize: 13 }}>{route.description}</p>
        )}
        <p style={{ margin: '8px 0 0', color: '#666', fontSize: 12 }}>
          状态: {route.status} | 版本: {route.version}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 style={{ margin: 0 }}>工序列表</h4>
        <Button size="small" icon={<PlusOutlined />} onClick={() => onAddStep(route.id)}>
          添加工序
        </Button>
      </div>

      {!route.steps.length ? (
        <div className={styles.emptyHint}>暂无工序</div>
      ) : (
        <div className={styles.stepList}>
          {route.steps.map((step, index) => (
            <div key={step.id} className={styles.stepCard}>
              <div className={styles.stepNumber}>{index + 1}</div>
              <div className={styles.stepInfo}>
                <p className={styles.stepName}>{step.name}</p>
                {step.description && <p className={styles.stepDesc}>{step.description}</p>}
                {step.parameters && (
                  <p className={styles.stepDesc}>
                    参数: {JSON.stringify(step.parameters)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
