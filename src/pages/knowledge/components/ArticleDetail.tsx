import { useState, useEffect } from 'react';
import { Tag, Button, Space, Input, List, message, Modal } from 'antd';
import { ArrowLeftOutlined, EyeOutlined, EditOutlined, SendOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { getArticleComments, addArticleComment } from '@/services/knowledge.service';
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

interface Comment {
  id: string;
  articleId: string;
  authorId: string;
  content: string;
  parentId?: string | null;
  createdAt: string;
}

const TAG_COLORS = ['blue', 'green', 'orange', 'purple', 'cyan', 'magenta', 'gold', 'lime'];

function getTagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

interface ArticleDetailProps {
  article: Article;
  onBack: () => void;
  onTagClick?: (tag: string) => void;
}

export default function ArticleDetail({ article, onBack, onTagClick }: ArticleDetailProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentContent, setCommentContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [versionModalVisible, setVersionModalVisible] = useState(false);

  useEffect(() => {
    getArticleComments(article.id).then((res) => {
      setComments(res.data || []);
    });
  }, [article.id]);

  const handleSubmitForReview = () => {
    Modal.confirm({
      title: '提交审核',
      content: '确定将此文章提交审核吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        message.success('文章已提交审核');
      },
    });
  };

  const handlePublish = () => {
    Modal.confirm({
      title: '发布文章',
      content: '确定发布此文章吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        message.success('文章已发布');
      },
    });
  };

  const handleSubmitComment = async () => {
    if (!commentContent.trim()) return;
    setSubmitting(true);
    try {
      await addArticleComment(article.id, { authorId: 'current-user', content: commentContent });
      const res = await getArticleComments(article.id);
      setComments(res.data || []);
      setCommentContent('');
      message.success('评论已提交');
    } catch {
      message.error('评论提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      await addArticleComment(article.id, { authorId: 'current-user', content: replyContent, parentId });
      const res = await getArticleComments(article.id);
      setComments(res.data || []);
      setReplyContent('');
      setReplyTo(null);
      message.success('回复已提交');
    } catch {
      message.error('回复提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const rootComments = comments.filter((c) => !c.parentId);
  const getReplies = (parentId: string) => comments.filter((c) => c.parentId === parentId);

  const renderComment = (comment: Comment, isReply = false) => {
    const replies = getReplies(comment.id);
    return (
      <div key={comment.id} style={{ marginLeft: isReply ? 32 : 0 }} data-testid={isReply ? 'nested-reply' : undefined}>
        <List.Item
          actions={[
            !isReply ? (
              <Button
                key="reply"
                type="link"
                size="small"
                data-testid={`reply-btn-${comment.id}`}
                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              >
                回复
              </Button>
            ) : undefined,
          ]}
        >
          <List.Item.Meta
            title={<span>{comment.authorId}</span>}
            description={comment.content}
          />
          <span className={styles.commentDate}>
            {new Date(comment.createdAt).toLocaleDateString()}
          </span>
        </List.Item>
        {replyTo === comment.id && (
          <div style={{ marginLeft: 32, marginBottom: 12 }}>
            <Input.TextArea
              placeholder={`回复 ${comment.authorId}...`}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={2}
              data-testid="reply-input"
            />
            <Button
              type="primary"
              size="small"
              onClick={() => handleSubmitReply(comment.id)}
              loading={submitting}
              style={{ marginTop: 4 }}
              data-testid="reply-submit-btn"
            >
              回复
            </Button>
            <Button
              size="small"
              onClick={() => { setReplyTo(null); setReplyContent(''); }}
              style={{ marginTop: 4, marginLeft: 4 }}
            >
              取消
            </Button>
          </div>
        )}
        {replies.map((reply) => renderComment(reply, true))}
      </div>
    );
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          返回列表
        </Button>
        <Button icon={<EditOutlined />}>编辑</Button>
        {article.status === 'draft' && (
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSubmitForReview}
            data-testid="submit-review-btn"
          >
            提交审核
          </Button>
        )}
        {article.status === 'review' && (
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={handlePublish}
            data-testid="publish-btn"
          >
            发布
          </Button>
        )}
      </Space>

      <h2>{article.title}</h2>

      <div className={styles.articleMeta}>
        <Tag color="blue">{article.category}</Tag>
        {article.tags.map((tag) => (
          <Tag
            key={tag}
            color={getTagColor(tag)}
            style={onTagClick ? { cursor: 'pointer' } : undefined}
            onClick={onTagClick ? () => onTagClick(tag) : undefined}
          >
            {tag}
          </Tag>
        ))}
        <span>
          <EyeOutlined /> {article.viewCount} 次查看
        </span>
        <span>
          版本: v1 | 创建于: {new Date(article.createdAt).toLocaleDateString()} | 更新于: {new Date(article.updatedAt).toLocaleDateString()}
        </span>
        <Button
          size="small"
          onClick={() => setVersionModalVisible(true)}
          data-testid="version-history-btn"
        >
          版本历史
        </Button>
      </div>

      <div className={styles.detailContent}>
        <div dangerouslySetInnerHTML={{ __html: article.content }} />
      </div>

      <div className={styles.commentsSection}>
        <h3>评论</h3>
        <List
          dataSource={rootComments}
          locale={{ emptyText: '暂无评论' }}
          renderItem={(comment) => renderComment(comment)}
        />
        <div className={styles.commentForm}>
          <Input.TextArea
            placeholder="发表评论..."
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            rows={3}
          />
          <Button
            type="primary"
            onClick={handleSubmitComment}
            loading={submitting}
            style={{ marginTop: 8 }}
          >
            提交
          </Button>
        </div>
      </div>

      <Modal
        title="版本历史"
        open={versionModalVisible}
        onCancel={() => setVersionModalVisible(false)}
        footer={null}
        data-testid="version-history-modal"
      >
        <List
          dataSource={[
            { version: 'v2', date: article.updatedAt, author: '系统', changes: '更新' },
            { version: 'v1', date: article.createdAt, author: '系统', changes: '创建' },
          ]}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={item.version}
                description={`${item.changes} | ${item.author} | ${new Date(item.date).toLocaleDateString()}`}
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
}
