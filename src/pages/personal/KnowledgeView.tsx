import { useState } from 'react';
import { List, Tag, Empty } from 'antd';
import { FolderOutlined, FileTextOutlined } from '@ant-design/icons';
import styles from './PersonalPage.module.css';

const KNOWLEDGE_CATEGORIES = [
  { key: 'all', label: '全部', icon: <FolderOutlined /> },
  { key: 'personal', label: '个人知识', icon: <FolderOutlined /> },
  { key: 'tech', label: '技术文档', icon: <FolderOutlined /> },
  { key: 'project', label: '项目文档', icon: <FolderOutlined /> },
  { key: 'process', label: '流程规范', icon: <FolderOutlined /> },
  { key: 'meeting', label: '会议记录', icon: <FolderOutlined /> },
  { key: 'design', label: '设计标准', icon: <FolderOutlined /> },
];

const MOCK_ARTICLES = [
  { id: '1', title: '产品设计评审规范', category: 'design', date: '2026-04-28', views: 128 },
  { id: '2', title: 'BOM管理流程指南', category: 'process', date: '2026-04-25', views: 96 },
  { id: '3', title: '项目管理最佳实践', category: 'project', date: '2026-04-20', views: 210 },
  { id: '4', title: 'NestJS后端开发规范', category: 'tech', date: '2026-04-15', views: 185 },
  { id: '5', title: 'Q2项目复盘会议纪要', category: 'meeting', date: '2026-04-10', views: 42 },
];

const CATEGORY_TAG_COLORS: Record<string, string> = {
  personal: 'blue',
  tech: 'cyan',
  project: 'purple',
  process: 'orange',
  meeting: 'green',
  design: 'magenta',
};

export default function KnowledgeView() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredArticles = activeCategory === 'all'
    ? MOCK_ARTICLES
    : MOCK_ARTICLES.filter((a) => a.category === activeCategory);

  return (
    <div data-testid="knowledge-section" style={{ display: 'flex', gap: 16 }}>
      <div className={styles.knowledgeSidebar}>
        <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>知识库</h4>
        {KNOWLEDGE_CATEGORIES.map((cat) => (
          <div
            key={cat.key}
            className={`${styles.sidebarItem} ${activeCategory === cat.key ? styles.sidebarItemActive : ''}`}
            onClick={() => setActiveCategory(cat.key)}
            data-testid={`knowledge-cat-${cat.key}`}
          >
            {cat.icon}
            <span style={{ marginLeft: 8 }}>{cat.label}</span>
          </div>
        ))}
      </div>
      <div className={styles.knowledgeContent}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>文档列表</h3>
        {filteredArticles.length === 0 ? (
          <Empty description="暂无文档" />
        ) : (
          <List
            dataSource={filteredArticles}
            renderItem={(item) => (
              <List.Item
                actions={[<span key="views" style={{ color: '#999', fontSize: 12 }}>{item.views} 次查看</span>]}
              >
                <List.Item.Meta
                  avatar={<FileTextOutlined style={{ fontSize: 20, color: '#3366FF' }} />}
                  title={item.title}
                  description={
                    <span>
                      <Tag color={CATEGORY_TAG_COLORS[item.category] || 'default'}>
                        {KNOWLEDGE_CATEGORIES.find((c) => c.key === item.category)?.label || item.category}
                      </Tag>
                      <span style={{ color: '#999', fontSize: 12 }}>{item.date}</span>
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
}
