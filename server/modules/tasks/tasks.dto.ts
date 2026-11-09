import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { TASK_PRIORITIES } from '@shared/api.interface';
import type { CreateTaskRequest, TaskPriority, UpdateTaskRequest } from '@shared/api.interface';

export class CreateTaskDto implements CreateTaskRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsIn(TASK_PRIORITIES)
  priority!: '高' | '中' | '低';
}

export class UpdateTaskDto implements UpdateTaskRequest {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @Type(() => String)
  @IsString()
  @IsIn(TASK_PRIORITIES)
  priority?: TaskPriority;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

export class TaskQueryDto {
  @IsOptional()
  @Type(() => String)
  @IsString()
  @IsIn(TASK_PRIORITIES)
  priority?: TaskPriority;
}
