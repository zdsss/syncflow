import { useState } from 'react';
import { Button, Tag, Tooltip } from 'antd';
import { PlusOutlined, ArrowDownOutlined, BranchesOutlined, HolderOutlined } from '@ant-design/icons';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  status: string | number;
  version: number;
  steps: ProcessStep[];
}

interface StepDetailProps {
  route: ProcessRoute | null;
  onAddStep: (routeId: string) => void;
  onReorder?: (routeId: string, orderedIds: string[]) => void;
}

function formatParameters(params: any): string {
  if (Array.isArray(params)) {
    return `${params.length}项参数`;
  }
  if (typeof params === 'object' && params !== null) {
    const keys = Object.keys(params);
    if (keys.length <= 3) return keys.join(', ');
    return `${keys.slice(0, 3).join(', ')} 等${keys.length}项`;
  }
  return String(params);
}

function SortableStep({ step, index }: { step: ProcessStep; index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className={styles.stepCard}>
        <div
          {...attributes}
          {...listeners}
          style={{ cursor: 'grab', display: 'flex', alignItems: 'center', marginRight: 8 }}
        >
          <HolderOutlined style={{ color: '#999', fontSize: 14 }} />
        </div>
        <div className={styles.stepNumber}>{index + 1}</div>
        <div className={styles.stepInfo}>
          <p className={styles.stepName}>{step.name}</p>
          {step.description && <p className={styles.stepDesc}>{step.description}</p>}
          {step.parameters && (
            <p className={styles.stepDesc}>
              参数: {formatParameters(step.parameters)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StepDetail({ route, onAddStep, onReorder }: StepDetailProps) {
  const [localSteps, setLocalSteps] = useState<ProcessStep[] | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!route) {
    return <div className={styles.emptyHint}>请选择一个工艺路线</div>;
  }

  const steps = localSteps && localSteps[0]?.id === route.steps[0]?.id
    ? localSteps
    : route.steps;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = steps.findIndex((s) => s.id === active.id);
    const newIndex = steps.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(steps, oldIndex, newIndex);
    setLocalSteps(reordered);

    if (onReorder) {
      onReorder(route.id, reordered.map((s) => s.id));
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ margin: 0 }}>{route.name}</h4>
        {route.description && (
          <p style={{ margin: '4px 0 0', color: '#999', fontSize: 13 }}>{route.description}</p>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 style={{ margin: 0 }}>工序列表</h4>
        <Button size="small" icon={<PlusOutlined />} onClick={() => onAddStep(route.id)}>
          添加工序
        </Button>
      </div>

      {!steps.length ? (
        <div className={styles.emptyHint}>暂无工序，点击上方按钮添加</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className={styles.stepList}>
              {steps.map((step, index) => (
                <SortableStep key={step.id} step={step} index={index} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
