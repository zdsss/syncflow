import { useState, useEffect } from 'react';
import { Input, Button } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import ArticleList from './components/ArticleList';
import ArticleDetail from './components/ArticleDetail';
import styles from './KnowledgePage.module.css';

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'technical', label: '技术文档' },
  { key: 'process', label: '流程规范' },
  { key: 'design', label: '设计标准' },
  { key: 'general', label: '通用知识' },
];

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  status: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function KnowledgePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory]);

  const fetchArticles = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (keyword) params.append('keyword', keyword);

      const res = await fetch(`/api/knowledge?${params}`);
      const data = await res.json();
      if (data.code === 0) {
        setArticles(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    }
  };

  const handleArticleSelect = async (id: string) => {
    try {
      const res = await fetch(`/api/knowledge/${id}`);
      const data = await res.json();
      if (data.code === 0) {
        setSelectedArticle(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch article:', error);
    }
  };

  if (selectedArticle) {
    return (
      <div className={styles.page}>
        <ArticleDetail
          article={selectedArticle}
          onBack={() => setSelectedArticle(null)}
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>知识管理</h1>
        <div className={styles.headerActions}>
          <Input
            placeholder="搜索文章..."
            prefix={<SearchOutlined />}
            className={styles.searchInput}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={fetchArticles}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />}>
            新建文章
          </Button>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.sidebar}>
          {CATEGORIES.map((cat) => (
            <div
              key={cat.key}
              className={`${styles.categoryItem} ${
                selectedCategory === cat.key ? styles.categoryItemActive : ''
              }`}
              onClick={() => setSelectedCategory(cat.key)}
            >
              {cat.label}
            </div>
          ))}
        </div>

        <div className={styles.mainContent}>
          <ArticleList articles={articles} onSelect={handleArticleSelect} />
        </div>
      </div>
    </div>
  );
}
