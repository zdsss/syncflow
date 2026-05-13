import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Spin, Empty, Tag } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { getUsers } from '@/services/config.service';
import type { PickerProps } from './index';
import styles from '../QuickCreateBar.module.css';

interface UserItem {
  id: number | string;
  username?: string;
  realName?: string;
  nickname?: string;
  name?: string;
  deptName?: string;
  departmentId?: string;
  [key: string]: any;
}

// Simple pinyin initial map for common Chinese surnames
const PINYIN_MAP: Record<string, string> = {
  '邓': 'd', '王': 'w', '陈': 'c', '李': 'l', '赵': 'z',
  '张': 'z', '刘': 'l', '周': 'z', '孙': 's', '吴': 'w',
  '徐': 'x', '马': 'm', '朱': 'z', '胡': 'h', '郭': 'g',
  '林': 'l', '何': 'h', '高': 'g', '罗': 'l', '郑': 'z',
  '梁': 'l', '谢': 'x', '宋': 's', '唐': 't', '许': 'x',
  '韩': 'h', '冯': 'f', '邓': 'd', '曹': 'c', '彭': 'p',
  '曾': 'z', '萧': 'x', '田': 't', '董': 'd', '潘': 'p',
  '袁': 'y', '蔡': 'c', '蒋': 'j', '余': 'y', '于': 'y',
  '苏': 's', '叶': 'y', '吕': 'l', '魏': 'w', '任': 'r',
  '姚': 'y', '沈': 's', '钟': 'z', '姜': 'j', '崔': 'c',
  '谭': 't', '陆': 'l', '范': 'f', '汪': 'w', '廖': 'l',
  '石': 's', '金': 'j', '贾': 'j', '夏': 'x', '付': 'f',
  '方': 'f', '邹': 'z', '熊': 'x', '白': 'b', '孟': 'm',
  '秦': 'q', '邱': 'q', '侯': 'h', '江': 'j', '尹': 'y',
  '薛': 'x', '闫': 'y', '雷': 'l', '龙': 'l', '黎': 'l',
  '史': 's', '陶': 't', '贺': 'h', '毛': 'm', '段': 'd',
  '郝': 'h', '顾': 'g', '龚': 'g', '邵': 's', '万': 'w',
  '覃': 'q', '武': 'w', '钱': 'q', '戴': 'd', '严': 'y',
  '欧阳': 'o', '司马': 's', '上官': 's', '诸葛': 'z',
};

function getPinyinInitial(name: string): string {
  if (!name) return '';
  // Check 2-char surnames first
  for (let len = 2; len >= 1; len--) {
    const prefix = name.slice(0, len);
    if (PINYIN_MAP[prefix]) return PINYIN_MAP[prefix];
  }
  return name[0]?.toLowerCase() || '';
}

export default function AssigneePicker({ searchQuery, onSelect, onClose }: PickerProps) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());
  const [highlightIdx, setHighlightIdx] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getUsers({ pageSize: 200 })
      .then((res) => {
        const data = res?.data;
        const list = Array.isArray(data) ? data : data?.records ?? [];
        setUsers(list);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const query = searchQuery.toLowerCase().trim();

  // Build flat list for keyboard navigation
  const flatList = useMemo(() => {
    const filtered = query
      ? users.filter((u) => {
          const name = u.realName || u.nickname || u.name || u.username || '';
          const pinyin = getPinyinInitial(name);
          return name.toLowerCase().includes(query) || pinyin.startsWith(query);
        })
      : users;
    return filtered;
  }, [users, query]);

  const grouped = useMemo(() => {
    const groups: Record<string, UserItem[]> = {};
    for (const u of flatList) {
      const dept = u.deptName || '未分配';
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(u);
    }
    return groups;
  }, [flatList]);

  const deptNames = Object.keys(grouped);

  const handleToggle = useCallback((user: UserItem) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(user.id)) {
        next.delete(user.id);
      } else {
        next.add(user.id);
      }
      return next;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (selectedIds.size === 0 && flatList.length > 0) {
      // If nothing selected but list exists, select the highlighted one
      const user = flatList[highlightIdx];
      if (user) {
        const name = user.realName || user.nickname || user.name || user.username;
        onSelect(name);
        return;
      }
    }
    // Return all selected names joined by comma
    const names = flatList
      .filter((u) => selectedIds.has(u.id))
      .map((u) => u.realName || u.nickname || u.name || u.username);
    if (names.length > 0) {
      // First selected is the assignee (prefix with @)
      onSelect(names[0]);
    }
  }, [selectedIds, flatList, highlightIdx, onSelect]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIdx((prev) => Math.min(prev + 1, flatList.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIdx((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatList[highlightIdx]) {
          handleToggle(flatList[highlightIdx]);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [flatList, highlightIdx, handleToggle, onClose]
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 16 }} data-testid="assignee-picker">
        <Spin size="small" />
      </div>
    );
  }

  if (deptNames.length === 0) {
    return (
      <div data-testid="assignee-picker">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无用户" />
      </div>
    );
  }

  let flatIndex = 0;

  return (
    <div data-testid="assignee-picker" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className={styles.pickerSearch}>
        <span style={{ fontSize: 11, color: '#999' }}>
          ↑↓ 选择 · Enter 确认 · 首字母快捷搜索
        </span>
      </div>
      <div className={styles.pickerList} ref={listRef}>
        {deptNames.map((dept) => (
          <div key={dept}>
            <div className={styles.pickerGroup}>{dept}</div>
            {grouped[dept].map((user) => {
              const idx = flatIndex++;
              const isSelected = selectedIds.has(user.id);
              const isHighlighted = idx === highlightIdx;
              const name = user.realName || user.nickname || user.name || user.username;
              return (
                <div
                  key={user.id}
                  className={styles.pickerItem}
                  style={{
                    background: isHighlighted ? '#e6f7ff' : isSelected ? '#f0f5ff' : undefined,
                    fontWeight: isSelected ? 600 : 400,
                  }}
                  onClick={() => handleToggle(user)}
                  onMouseEnter={() => setHighlightIdx(idx)}
                >
                  {isSelected && <CheckOutlined style={{ color: '#1890ff', fontSize: 12 }} />}
                  <span>{name}</span>
                  {isSelected && <Tag color="blue" style={{ marginLeft: 'auto', fontSize: 11 }}>已选</Tag>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {selectedIds.size > 0 && (
        <div
          style={{ padding: '6px 12px', borderTop: '1px solid #e8e8e8', textAlign: 'center' }}
        >
          <span
            style={{ color: '#1890ff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
            onClick={handleConfirm}
            data-testid="confirm-assignee"
          >
            确认选择 ({selectedIds.size}人) · 第一人为负责人
          </span>
        </div>
      )}
    </div>
  );
}
