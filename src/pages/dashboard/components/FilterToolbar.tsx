import type React from 'react';
import { Select } from 'antd';
import styles from './FilterToolbar.module.css';

const { Option } = Select;

interface FilterToolbarProps {
  companyFilter: string;
  progressFilter: string;
  onCompanyChange: (val: string) => void;
  onProgressChange: (val: string) => void;
}

export default function FilterToolbar({
  companyFilter,
  progressFilter,
  onCompanyChange,
  onProgressChange,
}: FilterToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.actions}>
        <button className={styles.actionBtn} type="button">
          + 新增
        </button>
        <button className={styles.secondaryBtn} type="button">
          导入
        </button>
        <button className={styles.secondaryBtn} type="button">
          配置
        </button>
      </div>
      <div className={styles.filters}>
        <Select
          value={companyFilter}
          onChange={onCompanyChange}
          style={{ width: 140 }}
          size="small"
          placeholder="公司管理"
        >
          <Option value="all">全部</Option>
          <Option value="company1">公司A</Option>
          <Option value="company2">公司B</Option>
        </Select>
        <Select
          value={progressFilter}
          onChange={onProgressChange}
          style={{ width: 140 }}
          size="small"
          placeholder="进度管理"
        >
          <Option value="all">全部</Option>
          <Option value="in_progress">进行中</Option>
          <Option value="delayed">已延期</Option>
          <Option value="not_started">未开始</Option>
          <Option value="completed">已完成</Option>
        </Select>
      </div>
    </div>
  );
}
