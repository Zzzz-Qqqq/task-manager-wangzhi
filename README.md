# 智能任务管理（Node.js + React + Supabase）

一个任务清单应用：输入任务、选优先级（高/中/低）添加，支持完成状态切换、删除、按优先级筛选，
数据持久化在 Supabase。

## 目录

```
client/                  React 前端（Vite）
server/                  NestJS 后端（本地开发用）
api/tasks.js             Vercel Serverless 函数（线上使用，走 Supabase REST）
scripts/vercel-build.js  Vercel 构建脚本（构建前端 + 处理 HTML 模板占位符）
vercel.json              Vercel 部署配置
```

## 本地开发

```bash
npm install
npm run dev
```

## 部署到 Vercel

1. 把本仓库导入 Vercel（New Project → Import Git Repository）。
2. 框架预设选 **Other**，其余留空，直接 Deploy。
   - 构建命令与产物目录已写在 `vercel.json`：`npm run build:vercel` → `dist/client`
3. 部署完成后访问分配的域名即可。

### 可选：用自己的 Supabase

默认已内置项目配置；要换成自己的项目，在 Vercel 项目的
**Settings → Environment Variables** 里添加：

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=sb_publishable_xxxx
```

### 数据库表结构

```sql
create table if not exists public.tasks (
  id         bigint generated always as identity primary key,
  title      text not null,
  priority   text not null check (priority in ('高', '中', '低')),
  completed  boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Allow anon read"   on public.tasks for select using (true);
create policy "Allow anon insert" on public.tasks for insert with check (true);
create policy "Allow anon update" on public.tasks for update using (true) with check (true);
create policy "Allow anon delete" on public.tasks for delete using (true);
```

## 说明

- 这个工程原本是低代码平台模板：前端 HTML 由 Nest + hbs 在服务端渲染，且 `postinstall`
  依赖平台内置的 `fullstack-cli`，所以直接部署到 Vercel 会构建失败。现在：
  - 已移除 `postinstall` 中对 `fullstack-cli` 的调用；
  - 构建阶段把 HTML 里的 `{{appName}}`、`{{{__platform__}}}` 等占位符替换成固定值；
  - 线上接口由 `api/tasks.js`（Node Serverless 函数 + `@supabase/supabase-js`）提供，
    行为与 `server/modules/tasks` 一致。
- 本地 `npm run dev` 仍然走 Nest 后端，两种方式读写同一张 Supabase 表。
