import { Tag, Button, Space } from 'antd';
import { ArrowLeftOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import styles from '../KnowledgePage.module.css';

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

interface ArticleDetailProps {
  article: Article;
  onBack: () => void;
}

export default function ArticleDetail({ article, onBack }: ArticleDetailProps) {
  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          返回列表
        </Button>
        <Button icon={<EditOutlined />}>编辑</Button>
      </Space>

      <h2>{article.title}</h2>

      <div className={styles.articleMeta}>
        <Tag color="blue">{article.category}</Tag>
        {article.tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
        <span>
          <EyeOutlined /> {article.viewCount} 次查看
        </span>
        <span>
          更新于 {new Date(article.updatedAt).toLocaleDateString()}
        </span>
      </div>

      <div className={styles.detailContent}>
        <div dangerouslySetInnerHTML={{ __html: article.content }} />
      </div>
    </div>
  );
}
