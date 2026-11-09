import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Check, Plus, Trash2 } from 'lucide-react';
import type {
  CreateTaskRequest,
  Task,
  TaskPriority,
} from '@shared/api.interface';
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS } from '@shared/api.interface';
import { tasksApi } from '@client/src/api';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Badge } from '@client/src/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import {
  Card,
  CardContent,
} from '@client/src/components/ui/card';

interface TasksPageProps {
  className?: string;
}

type FilterPriority = 'all' | TaskPriority;

const FILTER_OPTIONS: { value: FilterPriority; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: '高', label: '高' },
  { value: '中', label: '中' },
  { value: '低', label: '低' },
];

const PRIORITY_BADGE_VARIANT: Record<TaskPriority, string> = {
  '高': 'bg-priority-high text-priority-high-foreground border-transparent',
  '中':
    'bg-priority-medium text-priority-medium-foreground border-transparent',
  '低': 'bg-priority-low text-priority-low-foreground border-transparent',
};

const PRIORITY_STRIPE_CLASS: Record<TaskPriority, string> = {
  '高': 'bg-priority-high',
  '中': 'bg-priority-medium',
  '低': 'bg-priority-low',
};

const TasksPage: React.FC<TasksPageProps> = ({ className }) => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterPriority>('all');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('中');

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', filter],
    queryFn: () =>
      tasksApi.getTasks(filter === 'all' ? undefined : filter),
  });

  const tasks: Task[] = data?.items ?? [];

  const createMutation = useMutation({
    mutationFn: (body: CreateTaskRequest) => tasksApi.createTask(body),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: unknown) => {
      logger.error('创建任务失败', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      completed,
    }: {
      id: number;
      completed: boolean;
    }) => tasksApi.updateTask(id, { completed }),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: unknown) => {
      logger.error('更新任务失败', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => tasksApi.deleteTask(id),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: unknown) => {
      logger.error('删除任务失败', error);
    },
  });

  const handleAdd = (): void => {
    const trimmed = title.trim();
    if (!trimmed) return;
    createMutation.mutate({ title: trimmed, priority });
    setTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleToggle = (task: Task): void => {
    updateMutation.mutate({ id: task.id, completed: !task.completed });
  };

  const handleDelete = (id: number): void => {
    deleteMutation.mutate(id);
  };

  return (
    <div
      className={`min-h-screen bg-background py-8 px-4 ${className ?? ''}`}
    >
      <div className="max-w-xl mx-auto">
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <h1 className="text-2xl font-semibold mb-5 text-foreground">
              我的任务
            </h1>

            {/* 添加区 */}
            <div className="flex gap-2 mb-5">
              <Input
                type="text"
                placeholder="输入任务..."
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTitle(e.target.value)
                }
                onKeyDown={handleKeyDown}
                className="flex-1"
                aria-label="任务标题输入"
              />
              <Select
                value={priority}
                onValueChange={(val: string) => {
                  if (
                    TASK_PRIORITIES.includes(val as TaskPriority)
                  ) {
                    setPriority(val as TaskPriority);
                  }
                }}
              >
                <SelectTrigger className="w-[120px]" aria-label="优先级选择">
                  <SelectValue placeholder="优先级" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p: TaskPriority) => (
                    <SelectItem key={p} value={p}>
                      {TASK_PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="default"
                onClick={handleAdd}
                disabled={!title.trim() || createMutation.isPending}
                aria-label="添加任务"
              >
                <Plus className="h-4 w-4" />
                添加
              </Button>
            </div>

            {/* 筛选栏 */}
            <div className="flex gap-1 mb-4">
              {FILTER_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={filter === opt.value ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter(opt.value)}
                  aria-label={`筛选${opt.label}优先级任务`}
                  aria-pressed={filter === opt.value}
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            {/* 任务列表 */}
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                加载中...
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                暂无任务，添加一条开始吧
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task: Task) => (
                  <div
                    key={task.id}
                    className="bg-card rounded-lg shadow-sm p-4 flex items-center gap-3 hover:shadow-md hover:-translate-y-px transition-all border border-border"
                  >
                    {/* 左侧优先级色带 */}
                    <div
                      className={`w-[3px] self-stretch rounded-sm ${PRIORITY_STRIPE_CLASS[task.priority]}`}
                      aria-hidden="true"
                    />

                    {/* 完成按钮 */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className={
                        task.completed
                          ? 'text-success hover:text-success'
                          : ''
                      }
                      onClick={() => handleToggle(task)}
                      aria-label={
                        task.completed ? '标记为未完成' : '标记为已完成'
                      }
                    >
                      {task.completed ? (
                        <Check className="h-4 w-4" strokeWidth={2.5} />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/40" />
                      )}
                    </Button>

                    {/* 标题 */}
                    <span
                      className={`flex-1 text-base ${
                        task.completed
                          ? 'line-through text-muted-foreground'
                          : 'text-foreground'
                      }`}
                    >
                      {task.title}
                    </span>

                    {/* 优先级标签 */}
                    <Badge
                      className={PRIORITY_BADGE_VARIANT[task.priority]}
                    >
                      {TASK_PRIORITY_LABELS[task.priority]}
                    </Badge>

                    {/* 删除按钮 */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(task.id)}
                      aria-label={`删除任务: ${task.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TasksPage;
