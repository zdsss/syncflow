import { Card, Tag, Empty } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import styles from '../KnowledgePage.module.css';

interface Article {
  id: string;
  title: string;
  category: string;
  tags: string[];
  status: string;
  viewCount: number;
  createdAt: string;
}

interface ArticleListProps {
  articles: Article[];
  onSelect: (id: string) => void;
}

export default function ArticleList({ articles, onSelect }: ArticleListProps) {
  if (articles.length === 0) {
    return <Empty description="暂无文章" />;
  }

  return (
    <div>
      {articles.map((article) => (
        <Card
          key={article.id}
          className={styles.articleCard}
          hoverable
          onClick={() => onSelect(article.id)}
        >
          <div className={styles.articleTitle}>{article.title}</div>
          <div className={styles.articleMeta}>
            <Tag color="blue">{article.category}</Tag>
            {article.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
            <span>
              <EyeOutlined /> {article.viewCount}
            </span>
            <span>{new Date(article.createdAt).toLocaleDateString()}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
