import { Hono } from 'hono';
import { store } from '../store.js';
import { sendMessage } from '../services/message-bus.js';

const messages = new Hono();

// POST /api/messages
messages.post('/', async (c) => {
  const body = await c.req.json();
  const { fromAgentId, toAgentId, content, type, parentId } = body;

  if (!fromAgentId || !toAgentId || !content || !type) {
    return c.json({ error: 'fromAgentId, toAgentId, content, type 为必填项' }, 400);
  }

  const msg = sendMessage({ fromAgentId, toAgentId, content, type, parentId });
  return c.json({ message: msg });
});

// GET /api/messages/:agentId
messages.get('/:agentId', (c) => {
  const msgs = store.getMessagesFor(c.req.param('agentId'));
  return c.json({ messages: msgs });
});

export default messages;
