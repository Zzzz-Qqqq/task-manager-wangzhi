/**
 * Vercel Serverless 函数：任务 CRUD
 *
 * 真实的 Nest 后端无法在 Vercel 上常驻运行，所以这里把任务接口
 * 以 Node Serverless 函数的形式提供，数据层仍然走 @supabase/supabase-js
 * 访问同一张 Supabase tasks 表，行为与 server/modules/tasks 保持一致。
 *
 * 路由：
 *   GET    /api/tasks?priority=高|中|低   -> 列表（按创建时间倒序）
 *   POST   /api/tasks                     -> 新建
 *   PATCH  /api/tasks/:id                 -> 更新（完成状态等）
 *   DELETE /api/tasks/:id                 -> 删除
 * （:id 通过 vercel.json 的 rewrite 转成 ?id=）
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://umwzrxdhmqzhwmzlcygx.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || 'sb_publishable_sFwkkreZEdT2pUIxVJxHFQ_8Msc17jB';

const PRIORITIES = ['高', '中', '低'];
const MAX_TITLE = 255;

let client = null;
function getClient() {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
  }
  return client;
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (payload === undefined) {
    res.end();
    return;
  }
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body || '{}');
    } catch {
      return {};
    }
  }
  const raw = await new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function normalizePriority(value) {
  if (value === undefined || value === null || value === '') return undefined;
  return PRIORITIES.includes(value) ? value : null;
}

module.exports = async function handler(req, res) {
  try {
    const supabase = getClient();
    const idParam = req.query && req.query.id;
    const id = idParam ? Number(idParam) : undefined;
    const method = (req.method || 'GET').toUpperCase();

    if (method === 'GET') {
      const priority = normalizePriority(req.query && req.query.priority);
      if (priority === null) {
        return send(res, 400, { message: '优先级参数不合法，只能是 高/中/低' });
      }

      let query = supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      if (priority) query = query.eq('priority', priority);

      const { data, error } = await query;
      if (error) throw error;
      return send(res, 200, { items: data || [] });
    }

    if (method === 'POST') {
      const body = await readJsonBody(req);
      const title = typeof body.title === 'string' ? body.title.trim() : '';
      const priority = body.priority;

      if (!title) return send(res, 400, { message: '任务标题不能为空' });
      if (title.length > MAX_TITLE) {
        return send(res, 400, { message: `任务标题不能超过 ${MAX_TITLE} 个字符` });
      }
      if (!PRIORITIES.includes(priority)) {
        return send(res, 400, { message: '优先级不合法，只能是 高/中/低' });
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert({ title, priority })
        .select()
        .single();
      if (error) throw error;
      return send(res, 201, data);
    }

    if (method === 'PATCH' || method === 'PUT') {
      if (!id || Number.isNaN(id)) {
        return send(res, 400, { message: '缺少合法的任务 id' });
      }

      const body = await readJsonBody(req);
      const patch = {};
      if (body.title !== undefined) {
        const title = String(body.title).trim();
        if (!title) return send(res, 400, { message: '任务标题不能为空' });
        if (title.length > MAX_TITLE) {
          return send(res, 400, { message: `任务标题不能超过 ${MAX_TITLE} 个字符` });
        }
        patch.title = title;
      }
      if (body.priority !== undefined) {
        if (!PRIORITIES.includes(body.priority)) {
          return send(res, 400, { message: '优先级不合法，只能是 高/中/低' });
        }
        patch.priority = body.priority;
      }
      if (body.completed !== undefined) {
        if (typeof body.completed !== 'boolean') {
          return send(res, 400, { message: 'completed 必须是布尔值' });
        }
        patch.completed = body.completed;
      }
      if (Object.keys(patch).length === 0) {
        return send(res, 400, { message: '没有需要更新的字段' });
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(patch)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) return send(res, 404, { message: '任务不存在' });
      return send(res, 200, data);
    }

    if (method === 'DELETE') {
      if (!id || Number.isNaN(id)) {
        return send(res, 400, { message: '缺少合法的任务 id' });
      }

      const { data, error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .select('id');
      if (error) throw error;
      if (!data || data.length === 0) {
        return send(res, 404, { message: '任务不存在' });
      }
      return send(res, 204);
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return send(res, 405, { message: `不支持的请求方法: ${method}` });
  } catch (err) {
    const message =
      (err && err.message) === 'fetch failed'
        ? '无法连接 Supabase，请检查网络或 SUPABASE_URL 配置'
        : (err && err.message) || '服务器内部错误';
    return send(res, 500, { message });
  }
};
