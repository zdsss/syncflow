import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Row, Col, Button, Tag, Pagination, Empty, Tabs, Popconfirm, message } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { getNotes, deleteNote } from '@/services/personal.service';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAsyncAction } from '@/hooks/useAsyncData';
import NoteFormModal from './NoteFormModal';

interface Note {
  id: string;
  title: string;
  content: string;
  category?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  '工作': 'blue',
  '学习': 'green',
  '会议': 'orange',
  '其他': 'default',
};

export default function NotesList() {
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const currentUser = useAuthStore((s) => s.currentUser);
  const userId = currentUser?.id || '';

  const fetcher = useCallback(async () => {
    if (!userId) return { items: [] as Note[], total: 0 };
    const params: Record<string, any> = { page, pageSize };
    if (category) params.category = category;
    const data: any = await getNotes(userId, params);
    if (data.code === 0) {
      return { items: data.data.items as Note[], total: data.data.total as number };
    }
    return { items: [] as Note[], total: 0 };
  }, [userId, page, pageSize, category]);

  const { data: notesData, loading, refresh: fetchNotes } = useAsyncData(fetcher, '加载笔记失败');
  const notes = notesData?.items || [];

  useEffect(() => {
    if (notesData) {
      setTotal(notesData.total);
    }
  }, [notesData]);

  useEffect(() => {
    fetchNotes();
  }, [userId, page, category]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    notes.forEach((n) => { if (n.category) cats.add(n.category); });
    return Array.from(cats);
  }, [notes]);

  const { execute: executeDelete } = useAsyncAction<[string], void>(
    async (id: string) => {
      await deleteNote(id);
      fetchNotes();
    },
    { successMessage: '笔记已删除', errorMessage: '删除失败' },
  );

  const handleCreate = () => {
    setEditNote(null);
    setModalOpen(true);
  };

  const handleEdit = (note: Note) => {
    setEditNote(note);
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    setModalOpen(false);
    setEditNote(null);
    fetchNotes();
  };

  const tabItems = [
    { key: 'all', label: '全部' },
    ...categories.map((c) => ({ key: c, label: c })),
  ];

  const handleTabChange = (key: string) => {
    setCategory(key === 'all' ? undefined : key);
    setPage(1);
  };

  const truncateContent = (content: string, maxLen = 100) =>
    content.length > maxLen ? content.slice(0, maxLen) + '...' : content;

  const formatDate = (date: string) => new Date(date).toLocaleDateString('zh-CN');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>我的笔记</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建笔记
        </Button>
      </div>

      <Tabs items={tabItems} activeKey={category || 'all'} onChange={handleTabChange} style={{ marginBottom: 16 }} />

      {notes.length === 0 && !loading ? (
        <Empty description="暂无笔记" />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {notes.map((note) => (
              <Col key={note.id} xs={24} sm={12} lg={8}>
                <Card
                  hoverable
                  title={note.title}
                  extra={
                    <Tag color={CATEGORY_COLORS[note.category || '其他'] || 'default'}>
                      {note.category || '其他'}
                    </Tag>
                  }
                  actions={[
                    <Button
                      key="edit"
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(note)}
                    >
                      编辑
                    </Button>,
                    <Popconfirm
                      key="delete"
                      title="确定删除这条笔记？"
                      onConfirm={() => executeDelete(note.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button type="link" danger icon={<DeleteOutlined />}>
                        删除
                      </Button>
                    </Popconfirm>,
                  ]}
                >
                  <p style={{ color: '#666', marginBottom: 8, minHeight: 44 }}>
                    {truncateContent(note.content)}
                  </p>
                  <p style={{ color: '#999', fontSize: 12, margin: 0 }}>
                    {formatDate(note.createdAt)}
                  </p>
                </Card>
              </Col>
            ))}
          </Row>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={(p) => setPage(p)}
              showSizeChanger={false}
            />
          </div>
        </>
      )}

      <NoteFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
        note={editNote}
        userId={userId}
      />
    </div>
  );
}
