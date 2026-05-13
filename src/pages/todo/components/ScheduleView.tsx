import { useState } from 'react';
import { Button } from 'antd';
import { StarOutlined, StarFilled } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Task } from '@/types';

const WEEK_DAYS = ['周一', '周二', '周三', '周四', '周五'];

function getWeekDates(baseDate: dayjs.Dayjs) {
  const monday = baseDate.startOf('isoWeek');
  return Array.from({ length: 5 }, (_, i) => monday.add(i, 'day'));
}

function getTasksForDate(tasks: Task[], date: dayjs.Dayjs): Task[] {
  const dateStr = date.format('YYYY-MM-DD');
  return tasks.filter((t) => {
    if (t.plannedStart && dayjs(t.plannedStart).format('YYYY-MM-DD') === dateStr) return true;
    if (t.plannedEnd && dayjs(t.plannedEnd).format('YYYY-MM-DD') === dateStr) return true;
    return false;
  });
}

interface ScheduleViewProps {
  tasks: Task[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

export default function ScheduleView({ tasks, favorites, onToggleFavorite }: ScheduleViewProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const baseDate = dayjs().add(weekOffset, 'week');
  const weekDates = getWeekDates(baseDate);

  return (
    <div data-testid="schedule-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Button size="small" onClick={() => setWeekOffset((o) => o - 1)}>上一周</Button>
        <span style={{ fontWeight: 600 }}>
          {weekDates[0].format('YYYY/MM/DD')} - {weekDates[4].format('YYYY/MM/DD')}
        </span>
        <Button size="small" onClick={() => setWeekOffset((o) => o + 1)}>下一周</Button>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 8,
          border: '1px solid #E8E8E8',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {weekDates.map((date, i) => {
          const dayTasks = getTasksForDate(tasks, date);
          return (
            <div
              key={i}
              style={{ borderRight: i < 4 ? '1px solid #E8E8E8' : 'none', minHeight: 200 }}
              data-testid={`schedule-day-${date.format('YYYY-MM-DD')}`}
            >
              <div
                style={{
                  padding: '8px 12px',
                  background: date.isSame(dayjs(), 'day') ? '#EBF0FF' : '#FAFAFA',
                  borderBottom: '1px solid #E8E8E8',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {WEEK_DAYS[i]} {date.format('MM/DD')}
              </div>
              <div style={{ padding: '8px' }}>
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      padding: '4px 8px',
                      marginBottom: 4,
                      background: '#fff',
                      border: '1px solid #E8E8E8',
                      borderRadius: 4,
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 4,
                    }}
                    data-testid={`schedule-task-${task.id}`}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {task.title ?? task.name}
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(String(task.id));
                      }}
                      style={{ cursor: 'pointer', flexShrink: 0 }}
                      data-testid={`schedule-fav-${task.id}`}
                    >
                      {favorites.includes(String(task.id)) ? (
                        <StarFilled style={{ color: '#FAAD14', fontSize: 12 }} />
                      ) : (
                        <StarOutlined style={{ color: '#ccc', fontSize: 12 }} />
                      )}
                    </span>
                  </div>
                ))}
                {dayTasks.length === 0 && (
                  <div style={{ color: '#ccc', fontSize: 12, textAlign: 'center', padding: 8 }}>暂无任务</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
