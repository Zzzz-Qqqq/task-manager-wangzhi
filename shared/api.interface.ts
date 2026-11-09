export const TASK_PRIORITIES = ['高', '中', '低'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export const isTaskPriority = (v: string): v is TaskPriority =>
  (TASK_PRIORITIES as readonly string[]).includes(v);
export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  '高': '高',
  '中': '中',
  '低': '低',
};

export interface Task {
  id: number;
  title: string;
  priority: TaskPriority;
  completed: boolean;
  created_at: string;
}

export interface TaskListResponse {
  items: Task[];
}

export interface CreateTaskRequest {
  title: string;
  priority: TaskPriority;
}

export interface UpdateTaskRequest {
  title?: string;
  priority?: TaskPriority;
  completed?: boolean;
}
