import { useCallback } from 'react';
import { message, Modal } from 'antd';
import type { FormInstance } from 'antd';
import dayjs from 'dayjs';
import type { Task } from '@/types';
import type { Project } from '@/types/project';
import { getProjects, updateProject, createProject, deleteProject } from '@/services/project.service';
import { getTasks, updateTask, deleteTask } from '@/services/task.service';
import { getUsers } from '@/services/config.service';
import { getErrorMessage } from '@/services/api';

function findInTree(nodes: Project[], id: number): Project | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children?.length) {
      const found = findInTree(node.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

interface ProjectActionsParams {
  form: FormInstance;
  editForm: FormInstance;
  setProjects: (projects: Project[]) => void;
  setTasks: (tasks: Task[]) => void;
  setExpandedKeys: (keys: string[]) => void;
  setCreateModalOpen: (open: boolean) => void;
  setEditModalOpen: (open: boolean) => void;
  setEditingProject: (project: Project | null) => void;
  setCreateParentId: (id: string | undefined) => void;
  setSelectedTask: React.Dispatch<React.SetStateAction<Task | null>>;
  setAssigneeOptions: (options: { value: string; label: string }[]) => void;
}

export function useProjectActions({
  form,
  editForm,
  setProjects,
  setTasks,
  setExpandedKeys,
  setCreateModalOpen,
  setEditModalOpen,
  setEditingProject,
  setCreateParentId,
  setSelectedTask,
  setAssigneeOptions,
}: ProjectActionsParams) {
  const fetchData = useCallback(async () => {
    try {
      const [projRes, taskRes, userRes] = await Promise.all([
        getProjects(),
        getTasks({ pageNum: 1, pageSize: 500 }),
        getUsers(),
      ]);
      if (projRes?.data) {
        const projectList = projRes.data;
        setProjects(projectList);
        const level1 = projectList.filter((x: Project) => !x.parentId).map((x: Project) => String(x.id));
        const level2 = projectList.filter((x: Project) => level1.includes(String(x.parentId))).map((x: Project) => String(x.id));
        setExpandedKeys([...level1, ...level2]);
      }
      if (taskRes?.data) {
        setTasks(taskRes.data.records);
      }
      if (userRes?.data) {
        const users = Array.isArray(userRes.data) ? userRes.data : userRes.data?.records ?? [];
        setAssigneeOptions(
          users.map((u: { id: string; name: string }) => ({ value: u.id, label: u.name })),
        );
      }
    } catch {
      message.error('加载项目数据失败');
    }
  }, [setProjects, setTasks, setExpandedKeys, setAssigneeOptions]);

  const handleCreateProject = useCallback(async (createParentId?: string) => {
    try {
      const values = await form.validateFields();
      const [start, end] = values.dateRange || [];
      await createProject({
        code: values.code,
        name: values.name,
        description: values.description || '',
        ownerId: values.ownerId ? Number(values.ownerId) : undefined,
        plannedStart: start ? start.format('YYYY-MM-DD') : '',
        plannedEnd: end ? end.format('YYYY-MM-DD') : '',
        ...(createParentId ? { parentId: Number(createParentId) } : {}),
      });
      message.success('项目创建成功');
      setCreateModalOpen(false);
      setCreateParentId(undefined);
      form.resetFields();
      const projRes = await getProjects();
      if (projRes?.data) {
        setProjects(projRes.data);
      }
    } catch {
      message.error('创建项目失败');
    }
  }, [form, setProjects, setCreateModalOpen, setCreateParentId]);

  const handleTaskUpdate = useCallback(async (taskId: string, data: Partial<Task>) => {
    try {
      await updateTask(Number(taskId), data);
      const res = await getTasks({ pageNum: 1, pageSize: 500 });
      if (res?.data) setTasks(res.data.records);
      message.success('任务已更新');
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  }, [setTasks]);

  const handleScheduleSave = useCallback(async (taskId: string, data: Partial<Task>) => {
    await updateTask(Number(taskId), data);
  }, []);

  const handleScheduleSaveComplete = useCallback(async () => {
    try {
      const res = await getTasks({ pageNum: 1, pageSize: 500 });
      if (res?.data) setTasks(res.data.records);
      message.success('批量编辑已保存');
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  }, [setTasks]);

  const handleCollapseAll = useCallback(() => {
    setExpandedKeys([]);
  }, [setExpandedKeys]);

  const handleAddChild = useCallback((parentId: string) => {
    setCreateParentId(parentId);
    setCreateModalOpen(true);
  }, [setCreateParentId, setCreateModalOpen]);

  const handleEditProject = useCallback((id: string, projects: Project[]) => {
    const proj = findInTree(projects, Number(id));
    if (proj) {
      setEditingProject(proj);
      editForm.setFieldsValue({
        name: proj.name,
        description: proj.description,
        phase: proj.phase,
        ownerId: proj.ownerId,
        dateRange: proj.plannedStart && proj.plannedEnd ? [dayjs(proj.plannedStart), dayjs(proj.plannedEnd)] : undefined,
      });
      setEditModalOpen(true);
    }
  }, [editForm, setEditingProject, setEditModalOpen]);

  const handleDeleteProject = useCallback((id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该项目吗？此操作不可撤销。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteProject(Number(id));
          const projRes = await getProjects();
          if (projRes?.data) setProjects(projRes.data);
          message.success('项目已删除');
        } catch (err) {
          message.error(getErrorMessage(err));
        }
      },
    });
  }, [setProjects]);

  const handleTaskMove = useCallback(async (taskId: string, newPhase: string) => {
    try {
      await updateTask(Number(taskId), { status: Number(newPhase) });
      message.success('任务已移动');
      fetchData();
    } catch {
      message.error('移动失败');
    }
  }, [fetchData]);

  const handleSaveTask = useCallback(async (taskData: Partial<Task> & { id: string }) => {
    try {
      await updateTask(Number(taskData.id), taskData);
      await fetchData();
      message.success('任务已保存');
      setSelectedTask((prev) =>
        prev && String(prev.id) === taskData.id ? { ...prev, ...taskData } as Task : prev
      );
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  }, [fetchData, setSelectedTask]);

  const handleAssignTask = useCallback(async (taskId: string, userId: string) => {
    try {
      await updateTask(Number(taskId), { assigneeId: Number(userId) });
      message.success('指派成功');
      fetchData();
    } catch {
      message.error('指派失败');
    }
  }, [fetchData]);

  const handleStatusChange = useCallback(async (taskId: string, newStatus: string) => {
    try {
      await updateTask(Number(taskId), { status: Number(newStatus) });
      message.success('状态已更新');
      fetchData();
    } catch {
      message.error('状态更新失败');
    }
  }, [fetchData]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      await deleteTask(Number(taskId));
      setSelectedTask(null);
      message.success('任务已删除');
      fetchData();
    } catch {
      message.error('删除失败');
    }
  }, [fetchData, setSelectedTask]);

  const handleUpdateProject = useCallback(async (editingProject: Project | null) => {
    if (!editingProject) return;
    try {
      const values = await editForm.validateFields();
      const [start, end] = values.dateRange || [];
      await updateProject(Number(editingProject.id), {
        code: editingProject.code,
        name: values.name,
        description: values.description || '',
        phase: values.phase,
        ownerId: values.ownerId || '',
        plannedStart: start ? start.format('YYYY-MM-DD') : '',
        plannedEnd: end ? end.format('YYYY-MM-DD') : '',
      });
      const projRes = await getProjects();
      if (projRes?.data) setProjects(projRes.data);
      message.success('项目已更新');
      setEditModalOpen(false);
      editForm.resetFields();
      setEditingProject(null);
    } catch {
      message.error('更新项目失败');
    }
  }, [editForm, setProjects, setEditModalOpen, setEditingProject]);

  return {
    fetchData,
    handleCreateProject,
    handleTaskUpdate,
    handleScheduleSave,
    handleScheduleSaveComplete,
    handleCollapseAll,
    handleAddChild,
    handleEditProject,
    handleDeleteProject,
    handleTaskMove,
    handleSaveTask,
    handleAssignTask,
    handleStatusChange,
    handleDeleteTask,
    handleUpdateProject,
  };
}
