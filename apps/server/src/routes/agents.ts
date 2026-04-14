import { Hono } from 'hono';
import { store } from '../store.js';
import { registerAgent, heartbeat, markOffline } from '../services/agent-registry.js';
import { addFeedItem } from '../services/feed-generator.js';
import { broadcast } from '../sse.js';

const agents = new Hono();

// POST /api/agents/register
agents.post('/register', async (c) => {
  const body = await c.req.json();
  const { name, owner, department, skills, expertise, client } = body;

  if (!name || !owner || !department) {
    return c.json({ error: 'name, owner, department 为必填项' }, 400);
  }

  const agent = registerAgent({
    name,
    owner,
    department,
    skills: skills ?? [],
    expertise: expertise ?? [],
    client: client ?? 'openclaw',
  });

  broadcast({ event: 'agent-online', data: agent });
  addFeedItem({ type: 'agent-online', agentId: agent.id, data: { name: agent.name, department: agent.department } });

  return c.json({ agent });
});

// POST /api/agents/heartbeat
agents.post('/heartbeat', async (c) => {
  const { agentId } = await c.req.json();
  if (!agentId) return c.json({ error: 'agentId 必填' }, 400);

  const ok = heartbeat(agentId);
  if (!ok) return c.json({ error: 'Agent 不存在' }, 404);

  return c.json({ ok: true });
});

// POST /api/agents/offline
agents.post('/offline', async (c) => {
  const { agentId } = await c.req.json();
  if (!agentId) return c.json({ error: 'agentId 必填' }, 400);

  markOffline(agentId);
  const agent = store.getAgent(agentId);
  if (agent) {
    broadcast({ event: 'agent-offline', data: { agentId } });
    addFeedItem({ type: 'agent-offline', agentId, data: { name: agent.name } });
  }

  return c.json({ ok: true });
});

// GET /api/agents
agents.get('/', (c) => {
  const onlineOnly = c.req.query('online') === 'true';
  const list = onlineOnly ? store.getOnlineAgents() : store.getAllAgents();
  return c.json({ agents: list });
});

// GET /api/agents/:id
agents.get('/:id', (c) => {
  const agent = store.getAgent(c.req.param('id'));
  if (!agent) return c.json({ error: 'Not found' }, 404);
  return c.json({ agent });
});

export default agents;
