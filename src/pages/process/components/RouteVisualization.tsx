import { Tag, Tooltip } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import styles from './RouteVisualization.module.css';

interface ProcessStep {
  id: string;
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

interface RouteVisualizationProps {
  steps: ProcessStep[];
  currentStepId?: string;
}

export default function RouteVisualization({ steps, currentStepId }: RouteVisualizationProps) {
  if (!steps.length) {
    return <div className={styles.empty}>暂无工序</div>;
  }

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>工艺路线图</h4>
      <div className={styles.flow}>
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStepId;
          const paramCount = step.parameters ? Object.keys(step.parameters).length : 0;
          return (
            <div key={step.id} className={styles.stepWrapper}>
              {index > 0 && (
                <div className={styles.connector}>
                  <ArrowRightOutlined className={styles.arrow} />
                  <Tag color={index % 3 === 0 ? 'blue' : 'default'} className={styles.relationTag}>
                    {index % 3 === 0 ? '并行' : '串行'}
                  </Tag>
                </div>
              )}
              <Tooltip title={step.description || step.name}>
                <div className={`${styles.stepNode} ${isCurrent ? styles.current : ''}`}>
                  <div className={styles.stepNumber}>{index + 1}</div>
                  <div className={styles.stepName}>{step.name}</div>
                  {paramCount > 0 && (
                    <div className={styles.paramBadge}>{paramCount} 参数</div>
                  )}
                </div>
              </Tooltip>
            </div>
          );
        })}
      </div>
    </div>
  );
}
