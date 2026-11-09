import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  CreateTaskRequest,
  Task,
  TaskListResponse,
  UpdateTaskRequest,
} from '@shared/api.interface';

export async function getTasks(priority?: string): Promise<TaskListResponse> {
  const { data } = await axiosForBackend.get<TaskListResponse>('/api/tasks', {
    params: priority ? { priority } : undefined,
  });
  return data;
}

export async function createTask(body: CreateTaskRequest): Promise<Task> {
  const { data } = await axiosForBackend.post<Task>('/api/tasks', body);
  return data;
}

export async function updateTask(
  id: number,
  body: UpdateTaskRequest,
): Promise<Task> {
  const { data } = await axiosForBackend.patch<Task>(`/api/tasks/${id}`, body);
  return data;
}

export async function deleteTask(id: number): Promise<void> {
  await axiosForBackend.delete(`/api/tasks/${id}`);
}
