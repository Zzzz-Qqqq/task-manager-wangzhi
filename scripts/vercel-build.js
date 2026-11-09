/**
 * Vercel 构建脚本
 *
 * 这个工程原本是低代码平台的模板：前端 HTML 是交给 Nest + hbs 在服务端渲染的，
 * 里面带着 {{appName}} / {{{__platform__}}} 这类占位符，直接静态托管会残留占位符，
 * 甚至让内联脚本出现语法错误。Vercel 只做静态托管 + Serverless 函数，
 * 不会常驻运行 Nest，所以这里在构建阶段把模板占位符填成固定值，
 * 产出一份可以直接静态托管的 index.html。
 */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist', 'client');

function log(msg) {
  console.log(`[vercel-build] ${msg}`);
}

// 1. 构建前端
log('开始构建前端（vite build）');
execFileSync(
  path.join(ROOT, 'node_modules', '.bin', 'vite'),
  ['build', '--config', 'vite.config.ts'],
  { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'production' } },
);

// 2. 找到构建出来的 HTML 模板
const candidates = [
  path.join(DIST, 'client', 'index.html'),
  path.join(DIST, 'index.html'),
];
const source = candidates.find((p) => fs.existsSync(p));
if (!source) {
  console.error('[vercel-build] 找不到构建产物 index.html，构建终止');
  process.exit(1);
}

// 3. 替换 hbs 占位符（长占位符先替换，避免被短的误伤）
const replacements = [
  ['{{{__platform__}}}', '{}'],
  ['{{{appAvatar}}}', '"/favicon.svg"'],
  ['{{csrfToken}}', ''],
  ['{{basename}}', '/'],
  ['{{appName}}', '智能任务管理'],
  ['{{appDescription}}', '智能任务管理系统'],
  ['{{appAvatar}}', '/favicon.svg'],
  ['{{appId}}', 'task-manager'],
  ['{{tenantId}}', ''],
  ['{{userId}}', ''],
  ['{{userName}}', ''],
  ['{{environment}}', 'production'],
];

let html = fs.readFileSync(source, 'utf8');
for (const [token, value] of replacements) {
  html = html.split(token).join(value);
}

// 4. 兜底：任何没替换到的占位符都清空，避免残留到页面上
const leftovers = html.match(/\{\{[^}]*\}\}/g);
if (leftovers) {
  log(`清理残留占位符: ${[...new Set(leftovers)].join(', ')}`);
  html = html.replace(/\{\{[^}]*\}\}/g, '');
}

// 5. 输出到静态产物根目录，供 Vercel 作为站点入口
fs.mkdirSync(DIST, { recursive: true });
fs.writeFileSync(path.join(DIST, 'index.html'), html, 'utf8');

log('构建完成，静态产物目录: dist/client');
