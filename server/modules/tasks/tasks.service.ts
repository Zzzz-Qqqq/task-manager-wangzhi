import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { CreateTaskRequest, Task, TaskPriority, UpdateTaskRequest } from '@shared/api.interface';

@Injectable()
export class TasksService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private get client() {
    return this.supabaseService.getClient();
  }

  async list(priority?: TaskPriority): Promise<Task[]> {
    let query = this.client
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Task[];
  }

  async create(dto: CreateTaskRequest): Promise<Task> {
    const { data, error } = await this.client
      .from('tasks')
      .insert({ title: dto.title, priority: dto.priority })
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  }

  async update(id: number, dto: UpdateTaskRequest): Promise<Task> {
    const patch: Record<string, unknown> = {};
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.priority !== undefined) patch.priority = dto.priority;
    if (dto.completed !== undefined) patch.completed = dto.completed;

    const { data, error } = await this.client
      .from('tasks')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundException('任务不存在');
    return data as Task;
  }

  async remove(id: number): Promise<void> {
    const { data, error } = await this.client
      .from('tasks')
      .delete()
      .eq('id', id)
      .select('id');

    if (error) throw error;
    if (!data || data.length === 0) throw new NotFoundException('任务不存在');
  }
}
