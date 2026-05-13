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
  onTagClick?: (tag: string) => void;
}

const TAG_COLORS = ['blue', 'green', 'orange', 'purple', 'cyan', 'magenta', 'gold', 'lime'];

function getTagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

export default function ArticleList({ articles, onSelect, onTagClick }: ArticleListProps) {
  if (articles.length === 0) {
    return <Empty description="暂无文章" />;
  }

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation();
    onTagClick?.(tag);
  };

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
              <Tag
                key={tag}
                color={onTagClick ? getTagColor(tag) : undefined}
                style={onTagClick ? { cursor: 'pointer' } : undefined}
                onClick={onTagClick ? (e) => handleTagClick(e, tag) : undefined}
              >
                {tag}
              </Tag>
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
