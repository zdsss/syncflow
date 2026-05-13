import { useState, useEffect, useMemo, useCallback } from 'react';
import { Input, Button, Tag, Select, Modal, Form, message } from 'antd';
import { SearchOutlined, PlusOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { getArticles, getArticle, getCategories, createArticle } from '@/services/knowledge.service';
import { useAsyncData, useAsyncAction } from '@/hooks/useAsyncData';
import ArticleList from './components/ArticleList';
import ArticleDetail from './components/ArticleDetail';
import styles from './KnowledgePage.module.css';

interface CategoryItem {
  key: string;
  label: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  technical: '技术文档',
  process: '流程规范',
  design: '设计标准',
  general: '通用知识',
};

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
  const [categories, setCategories] = useState<CategoryItem[]>([
    { key: 'all', label: '全部' },
  ]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [keyword, setKeyword] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [form] = Form.useForm();

  const categoriesFetcher = useCallback(async () => {
    const data: any = await getCategories();
    if (data.code === 0) {
      return [
        { key: 'all', label: '全部' },
        ...data.data.map((cat: string) => ({
          key: cat,
          label: CATEGORY_LABELS[cat] || cat,
        })),
      ] as CategoryItem[];
    }
    return [{ key: 'all', label: '全部' }];
  }, []);

  const { refresh: refreshCategories } = useAsyncData<CategoryItem[]>(
    categoriesFetcher,
    '加载分类失败',
  );

  const articlesFetcher = useCallback(async () => {
    const params: Record<string, string> = {};
    if (selectedCategory !== 'all') params.category = selectedCategory;
    if (keyword) params.keyword = keyword;
    if (selectedTag) params.tag = selectedTag;
    const data: any = await getArticles(params);
    if (data.code === 0) return data.data as Article[];
    return [];
  }, [selectedCategory, keyword, selectedTag]);

  const { data: articles, refresh: refreshArticles } = useAsyncData<Article[]>(
    articlesFetcher,
    '加载文章列表失败',
  );

  const { execute: executeArticleSelect, loading: detailLoading } = useAsyncAction<[string], Article>(
    async (id: string) => {
      const data: any = await getArticle(id);
      if (data.code === 0) return data.data as Article;
      throw new Error('获取文章失败');
    },
    { errorMessage: '加载文章失败' },
  );

  const { execute: executeCreate, loading: createLoading } = useAsyncAction(
    async () => {
      const values = await form.validateFields();
      await createArticle({
        title: values.title,
        content: values.content,
        category: values.category || 'general',
        tags: values.tags || [],
      });
    },
    { errorMessage: '创建文章失败', successMessage: '文章创建成功' },
  );

  useEffect(() => {
    refreshCategories();
  }, [refreshCategories]);

  useEffect(() => {
    refreshArticles();
  }, [refreshArticles]);

  const handleArticleSelect = async (id: string) => {
    const article = await executeArticleSelect(id);
    if (article) setSelectedArticle(article);
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
  };

  const handleClearTagFilter = () => {
    setSelectedTag(null);
  };

  const handleCreateArticle = async () => {
    await executeCreate();
    setEditorVisible(false);
    form.resetFields();
    refreshArticles();
  };

  const articleList = articles || [];
  const displayedArticles = selectedTag
    ? articleList.filter((a) => (a.tags || []).includes(selectedTag))
    : articleList;

  const tagCloud = useMemo(() => {
    const counts: Record<string, number> = {};
    articleList.forEach((a) => {
      (a.tags || []).forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
  }, [articleList]);

  if (selectedArticle) {
    return (
      <div className={styles.page}>
        <ArticleDetail
          article={selectedArticle}
          onBack={() => setSelectedArticle(null)}
          onTagClick={(tag) => {
            setSelectedArticle(null);
            setSelectedTag(tag);
          }}
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
            onPressEnter={refreshArticles}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditorVisible(true)}>
            新建文章
          </Button>
        </div>
      </div>

      {selectedTag && (
        <div className={styles.tagFilterBar}>
          <span>按标签筛选：</span>
          <Tag color="blue" closable onClose={handleClearTagFilter}>
            {selectedTag}
          </Tag>
          <Button type="link" size="small" icon={<CloseCircleOutlined />} onClick={handleClearTagFilter}>
            清除筛选
          </Button>
        </div>
      )}

      <div className={styles.body}>
        <div className={styles.sidebar}>
          {categories.map((cat) => (
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
          {tagCloud.length > 0 && (
            <div className={styles.tagCloudSection}>
              <div className={styles.tagCloudTitle}>热门标签</div>
              <div className={styles.tagCloudBody}>
                {tagCloud.map(({ tag, count }) => {
                  const maxCount = tagCloud[0]?.count || 1;
                  const ratio = count / maxCount;
                  const fontSize = 12 + Math.round(ratio * 8);
                  return (
                    <Tag
                      key={tag}
                      color={selectedTag === tag ? 'blue' : undefined}
                      style={{ cursor: 'pointer', fontSize, marginBottom: 4 }}
                      onClick={() => handleTagClick(tag)}
                      data-testid={`tag-cloud-${tag}`}
                    >
                      {tag} ({count})
                    </Tag>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className={styles.mainContent}>
          <ArticleList articles={displayedArticles} onSelect={handleArticleSelect} onTagClick={handleTagClick} />
        </div>
      </div>

      <Modal
        title="新建文章"
        open={editorVisible}
        onOk={handleCreateArticle}
        onCancel={() => { setEditorVisible(false); form.resetFields(); }}
        okText="创建"
        cancelText="取消"
        width={640}
        confirmLoading={createLoading}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入文章标题' }]}>
            <Input placeholder="请输入文章标题" />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入文章内容' }]}>
            <Input.TextArea placeholder="请输入文章内容" rows={6} />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Select placeholder="选择分类">
              {categories.filter((c) => c.key !== 'all').map((cat) => (
                <Select.Option key={cat.key} value={cat.key}>{cat.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="输入或选择标签" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
