import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createSSEStream } from './sse.js';
import { startHeartbeatWatcher } from './services/agent-registry.js';
import agents from './routes/agents.js';
import messages from './routes/messages.js';
import feed from './routes/feed.js';

const app = new Hono();
const PORT = 3888;

// CORS — 允许本地 Web 开发调试
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', '*'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

// 路由
app.route('/api/agents', agents);
app.route('/api/messages', messages);
app.route('/api/feed', feed);

// SSE 实时推送
app.get('/api/stream/:agentId', (c) => {
  const agentId = c.req.param('agentId');
  return createSSEStream(agentId);
});

// 健康检查
app.get('/health', (c) => c.json({ ok: true, timestamp: new Date().toISOString() }));

// 启动心跳监控
startHeartbeatWatcher();

console.log(`🦞 Lobster Community Server running on http://localhost:${PORT}`);

export default {
  port: PORT,
  fetch: app.fetch,
};
